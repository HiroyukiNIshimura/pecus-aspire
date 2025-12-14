using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.Focus;

namespace Pecus.Services;

/// <summary>
/// フォーカス推奨サービス
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
    /// ユーザーのフォーカス推奨タスクを取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>フォーカス推奨レスポンス</returns>
    public async Task<FocusRecommendationResponse> GetFocusRecommendationAsync(int userId)
    {
        _logger.LogInformation("フォーカス推奨タスク取得開始: UserId={UserId}", userId);

        // ユーザー設定を取得（デフォルト値使用）
        var userSetting = await _context.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        var focusScorePriority = userSetting?.FocusScorePriority ?? FocusScorePriority.Deadline;
        var focusTasksLimit = userSetting?.FocusTasksLimit ?? 5;
        var waitingTasksLimit = userSetting?.WaitingTasksLimit ?? 5;

        // 優先要素に応じた重み設定
        // 設計書基準: 優先度=2, 期限=3, 後続タスク影響=5
        // 選択した要素は+2して強調
        var (priorityWeight, deadlineWeight, successorImpactWeight) = focusScorePriority switch
        {
            FocusScorePriority.Priority => (4m, 3m, 5m),     // 優先度を強調
            FocusScorePriority.Deadline => (2m, 5m, 5m),     // 期限を強調
            FocusScorePriority.SuccessorImpact => (2m, 3m, 7m), // 後続タスク影響を強調
            _ => (2m, 3m, 5m) // デフォルト（設計書基準）
        };

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
            .Include(t => t.PredecessorTask!)
                .ThenInclude(p => p.WorkspaceItem)
            .Where(t => t.AssignedUserId == userId
                && !t.IsCompleted
                && !t.IsDiscarded)
            .ToListAsync();

        _logger.LogInformation("対象タスク数: {Count}", tasks.Count);

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

        // タスクをスコアリング
        var scoredTasks = tasks.Select(task =>
        {
            var successorCount = successorCounts.GetValueOrDefault(task.Id, 0);
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
                ScoreDetail = scoreDetail,
                CanStart = task.PredecessorTask == null || task.PredecessorTask.IsCompleted
            };
        }).ToList();

        // 着手可能タスク（スコア上位）
        var focusTasks = scoredTasks
            .Where(x => x.CanStart)
            .OrderByDescending(x => x.TotalScore)
            .Take(focusTasksLimit)
            .Select(x => MapToFocusTaskResponse(x.Task, x.TotalScore, x.SuccessorCount, x.ScoreDetail))
            .ToList();

        // 待機中タスク（先行タスク未完了、スコア順）
        var waitingTasks = scoredTasks
            .Where(x => !x.CanStart)
            .OrderByDescending(x => x.TotalScore)
            .Take(waitingTasksLimit)
            .Select(x => MapToFocusTaskResponse(x.Task, x.TotalScore, x.SuccessorCount, x.ScoreDetail))
            .ToList();

        _logger.LogDebug(
            "フォーカス推奨タスク取得完了: FocusTasks={FocusCount}, WaitingTasks={WaitingCount}",
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
    /// タスクの総合スコアを計算
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
        var priorityScore = CalculatePriorityScore(task.Priority);
        var deadlineScore = CalculateDeadlineScore(task.DueDate);
        var successorImpactScore = CalculateSuccessorImpactScore(successorCount);

        var totalScore = (priorityScore * priorityWeight)
                       + (deadlineScore * deadlineWeight)
                       + (successorImpactScore * successorImpactWeight);

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
    /// 優先度スコアを計算
    /// </summary>
    /// <param name="priority">優先度（NULLの場合はLowとして扱う）</param>
    /// <returns>優先度スコア（1-4）</returns>
    private decimal CalculatePriorityScore(TaskPriority? priority)
    {
        return priority switch
        {
            TaskPriority.Critical => 4m,
            TaskPriority.High => 3m,
            TaskPriority.Medium => 2m,
            TaskPriority.Low => 1m,
            null => 1m, // NULLの場合はLowとして扱う（設計書準拠）
            _ => 1m
        };
    }

    /// <summary>
    /// 期限スコアを計算
    /// </summary>
    /// <param name="dueDate">期限日時</param>
    /// <returns>期限スコア（1-10、期限が近いほど高い）</returns>
    private decimal CalculateDeadlineScore(DateTimeOffset dueDate)
    {
        var now = DateTimeOffset.UtcNow;
        var timeUntilDue = dueDate - now;

        // 期限切れ
        if (timeUntilDue.TotalHours < 0)
        {
            return 10m;
        }

        // 今日中（24時間以内）
        if (timeUntilDue.TotalHours <= 24)
        {
            return 8m;
        }

        // 明日（48時間以内）
        if (timeUntilDue.TotalHours <= 48)
        {
            return 6m;
        }

        // 2-3日後（72時間以内）
        if (timeUntilDue.TotalHours <= 72)
        {
            return 4m;
        }

        // 今週中（7日以内）
        if (timeUntilDue.TotalDays <= 7)
        {
            return 3m;
        }

        // 来週（14日以内）
        if (timeUntilDue.TotalDays <= 14)
        {
            return 2m;
        }

        // それ以降
        return 1m;
    }

    /// <summary>
    /// 後続タスク影響スコアを計算
    /// </summary>
    /// <param name="successorCount">後続タスク数</param>
    /// <returns>影響スコア（0-10）</returns>
    private decimal CalculateSuccessorImpactScore(int successorCount)
    {
        return successorCount switch
        {
            >= 3 => 10m,
            2 => 6m,
            1 => 3m,
            _ => 0m
        };
    }

    /// <summary>
    /// WorkspaceTaskをFocusTaskResponseにマッピング
    /// </summary>
    private FocusTaskResponse MapToFocusTaskResponse(
        WorkspaceTask task,
        decimal totalScore,
        int successorCount,
        TaskScoreDetail scoreDetail
    )
    {
        return new FocusTaskResponse
        {
            Id = task.Id,
            WorkspaceItemId = task.WorkspaceItemId,
            WorkspaceId = task.WorkspaceId,
            WorkspaceCode = task.WorkspaceItem.Workspace?.Code,
            WorkspaceName = task.WorkspaceItem.Workspace?.Name,
            ItemCode = task.WorkspaceItem.Code,
            Content = task.Content,
            ItemSubject = task.WorkspaceItem.Subject,
            Priority = task.Priority,
            DueDate = task.DueDate,
            EstimatedHours = task.EstimatedHours,
            ProgressPercentage = task.ProgressPercentage,
            TotalScore = totalScore,
            SuccessorCount = successorCount,
            PredecessorTask = task.PredecessorTask != null
                ? new PredecessorTaskInfo
                {
                    Id = task.PredecessorTask.Id,
                    WorkspaceItemCode = task.PredecessorTask.WorkspaceItem.Code,
                    Content = task.PredecessorTask.Content,
                    IsCompleted = task.PredecessorTask.IsCompleted
                }
                : null,
            ScoreDetail = scoreDetail
        };
    }
}
