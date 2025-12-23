using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Focus;
using Pecus.Models.Responses.Focus;
using Pecus.Models.Responses.WorkspaceTask;

namespace Pecus.Services;

/// <summary>
/// やることピックアップサービス
/// タスクのスコアリングと推奨タスクの選定を行います
/// </summary>
public class FocusRecommendationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<FocusRecommendationService> _logger;

    public FocusRecommendationService(
        ApplicationDbContext context,
        ILogger<FocusRecommendationService> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// ユーザーのやることピックアップタスクを取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>やることピックアップレスポンス</returns>
    public async Task<FocusRecommendationResponse> GetFocusRecommendationAsync(int userId)
    {
        _logger.LogDebug("やることピックアップタスク取得開始: UserId={UserId}", userId);

        // ユーザー設定を取得（デフォルト値使用）
        var userSetting = await _context.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        var focusScorePriority = userSetting?.FocusScorePriority ?? FocusScorePriority.Deadline;
        var focusTasksLimit = userSetting?.FocusTasksLimit ?? 5;
        var waitingTasksLimit = userSetting?.WaitingTasksLimit ?? 5;

        // 優先要素に応じた重み設定（Libsのコアロジックを使用）
        var (priorityWeight, deadlineWeight, successorImpactWeight) =
            TaskScoreCalculator.GetWeights(focusScorePriority);

        _logger.LogDebug(
            "スコアリング設定: Priority={FocusScorePriority}, Weights=({PriorityWeight}, {DeadlineWeight}, {SuccessorImpactWeight}), Limits=({FocusLimit}, {WaitingLimit})",
            focusScorePriority,
            priorityWeight,
            deadlineWeight,
            successorImpactWeight,
            focusTasksLimit,
            waitingTasksLimit
        );

        // ユーザーの未完了タスクを取得（破棄済みは除外）
        var tasks = await _context.WorkspaceTasks
            .Include(t => t.WorkspaceItem)
                .ThenInclude(i => i.Workspace)
                    .ThenInclude(w => w!.Genre)
            .Include(t => t.TaskType)
            .Include(t => t.PredecessorTask!)
                .ThenInclude(p => p.WorkspaceItem)
            .Where(t => t.AssignedUserId == userId
                && !t.IsCompleted
                && !t.IsDiscarded)
            .ToListAsync();

        _logger.LogDebug("対象タスク数: {Count}", tasks.Count);

        if (tasks.Count == 0)
        {
            return new FocusRecommendationResponse
            {
                FocusTasks = new List<FocusTaskResponse>(),
                WaitingTasks = new List<FocusTaskResponse>(),
                TotalTaskCount = 0,
                GeneratedAt = DateTimeOffset.UtcNow
            };
        }

        // 後続タスク数をカウント（一度のクエリで全て取得）
        var taskIds = tasks.Select(t => t.Id).ToList();
        var successorCounts = await _context.WorkspaceTasks
            .Where(t => t.PredecessorTaskId != null
                && taskIds.Contains(t.PredecessorTaskId.Value)
                && !t.IsCompleted
                && !t.IsDiscarded)
            .GroupBy(t => t.PredecessorTaskId!.Value)
            .Select(g => new { TaskId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TaskId, x => x.Count);

        // 後続タスクの先頭1件を取得（各タスクごとに最初の後続タスク）
        var firstSuccessors = await _context.WorkspaceTasks
            .Include(t => t.WorkspaceItem)
            .Where(t => t.PredecessorTaskId != null
                && taskIds.Contains(t.PredecessorTaskId.Value)
                && !t.IsCompleted
                && !t.IsDiscarded)
            .GroupBy(t => t.PredecessorTaskId!.Value)
            .Select(g => new
            {
                PredecessorTaskId = g.Key,
                FirstSuccessor = g.OrderBy(t => t.Id).First()
            })
            .ToDictionaryAsync(x => x.PredecessorTaskId, x => x.FirstSuccessor);

        // タスクをスコアリング
        var scoredTasks = tasks.Select(task =>
        {
            var successorCount = successorCounts.GetValueOrDefault(task.Id, 0);
            var firstSuccessor = firstSuccessors.GetValueOrDefault(task.Id);
            var (totalScore, scoreDetail) = CalculateTaskScore(
                task,
                successorCount,
                priorityWeight,
                deadlineWeight,
                successorImpactWeight
            );

            return new
            {
                Task = task,
                TotalScore = totalScore,
                SuccessorCount = successorCount,
                FirstSuccessor = firstSuccessor,
                ScoreDetail = scoreDetail,
                CanStart = task.PredecessorTask == null || task.PredecessorTask.IsCompleted
            };
        }).ToList();

        // 着手可能タスク（スコア上位）
        var focusTasks = scoredTasks
            .Where(x => x.CanStart)
            .OrderByDescending(x => x.TotalScore)
            .Take(focusTasksLimit)
            .Select(x => MapToFocusTaskResponse(x.Task, x.TotalScore, x.SuccessorCount, x.FirstSuccessor, x.ScoreDetail))
            .ToList();

        // 待機中タスク（先行タスク未完了、スコア順）
        var waitingTasks = scoredTasks
            .Where(x => !x.CanStart)
            .OrderByDescending(x => x.TotalScore)
            .Take(waitingTasksLimit)
            .Select(x => MapToFocusTaskResponse(x.Task, x.TotalScore, x.SuccessorCount, x.FirstSuccessor, x.ScoreDetail))
            .ToList();

        _logger.LogDebug(
            "やることピックアップタスク取得完了: FocusTasks={FocusCount}, WaitingTasks={WaitingCount}",
            focusTasks.Count,
            waitingTasks.Count
        );

        return new FocusRecommendationResponse
        {
            FocusTasks = focusTasks,
            WaitingTasks = waitingTasks,
            TotalTaskCount = tasks.Count,
            GeneratedAt = DateTimeOffset.UtcNow
        };
    }

    /// <summary>
    /// タスクの総合スコアを計算（Libsのコアロジックを使用）
    /// </summary>
    /// <param name="task">タスク</param>
    /// <param name="successorCount">後続タスク数</param>
    /// <param name="priorityWeight">優先度の重み</param>
    /// <param name="deadlineWeight">期限の重み</param>
    /// <param name="successorImpactWeight">後続タスク影響の重み</param>
    /// <returns>総合スコアとスコア詳細</returns>
    private (decimal TotalScore, TaskScoreDetail ScoreDetail) CalculateTaskScore(
        WorkspaceTask task,
        int successorCount,
        decimal priorityWeight,
        decimal deadlineWeight,
        decimal successorImpactWeight
    )
    {
        var priorityScore = TaskScoreCalculator.CalculatePriorityScore(task.Priority);
        var deadlineScore = TaskScoreCalculator.CalculateDeadlineScore(task.DueDate);
        var successorImpactScore = TaskScoreCalculator.CalculateSuccessorImpactScore(successorCount);

        var totalScore = TaskScoreCalculator.CalculateTotalScore(
            task.Priority,
            task.DueDate,
            successorCount,
            priorityWeight,
            deadlineWeight,
            successorImpactWeight
        );

        var scoreDetail = new TaskScoreDetail
        {
            PriorityScore = priorityScore,
            DeadlineScore = deadlineScore,
            SuccessorImpactScore = successorImpactScore,
            PriorityWeight = priorityWeight,
            DeadlineWeight = deadlineWeight,
            SuccessorImpactWeight = successorImpactWeight,
            Explanation = $"({priorityScore} × {priorityWeight}) + ({deadlineScore} × {deadlineWeight}) + ({successorImpactScore} × {successorImpactWeight}) = {totalScore}"
        };

        return (totalScore, scoreDetail);
    }

    /// <summary>
    /// WorkspaceTaskをFocusTaskResponseにマッピング
    /// </summary>
    private FocusTaskResponse MapToFocusTaskResponse(
        WorkspaceTask task,
        decimal totalScore,
        int successorCount,
        WorkspaceTask? firstSuccessor,
        TaskScoreDetail scoreDetail
    )
    {
        return new FocusTaskResponse
        {
            Id = task.Id,
            Sequence = task.Sequence,
            WorkspaceItemId = task.WorkspaceItemId,
            WorkspaceId = task.WorkspaceId,
            WorkspaceCode = task.WorkspaceItem.Workspace?.Code,
            WorkspaceName = task.WorkspaceItem.Workspace?.Name,
            ItemCode = task.WorkspaceItem.Code,
            Content = task.Content,
            ItemSubject = task.WorkspaceItem.Subject,
            TaskTypeId = task.TaskTypeId,
            TaskTypeCode = task.TaskType?.Code,
            TaskTypeName = task.TaskType?.Name,
            TaskTypeIcon = task.TaskType?.Icon,
            Priority = task.Priority,
            DueDate = task.DueDate,
            EstimatedHours = task.EstimatedHours,
            ProgressPercentage = task.ProgressPercentage,
            TotalScore = totalScore,
            SuccessorCount = successorCount,
            SuccessorTask = firstSuccessor != null
                ? new SuccessorTaskInfo
                {
                    Id = firstSuccessor.Id,
                    WorkspaceItemCode = firstSuccessor.WorkspaceItem.Code,
                    Content = firstSuccessor.Content
                }
                : null,
            PredecessorTask = task.PredecessorTask != null
                ? new PredecessorTaskInfo
                {
                    Id = task.PredecessorTask.Id,
                    Sequence = task.PredecessorTask.Sequence,
                    WorkspaceItemCode = task.PredecessorTask.WorkspaceItem.Code,
                    Content = task.PredecessorTask.Content,
                    IsCompleted = task.PredecessorTask.IsCompleted
                }
                : null,
            ScoreDetail = scoreDetail
        };
    }
}