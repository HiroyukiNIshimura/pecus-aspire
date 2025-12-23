using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Focus.Models;

namespace Pecus.Libs.Focus;

/// <summary>
/// やることリストのタスク取得サービス（Libs内部用）
/// </summary>
public interface IFocusTaskProvider
{
    /// <summary>
    /// ユーザーのやることリストを取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="focusTasksLimit">着手可能タスクの上限（デフォルト: 5）</param>
    /// <param name="waitingTasksLimit">待機中タスクの上限（デフォルト: 5）</param>
    /// <param name="focusScorePriority">スコア計算の優先要素</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>やることリスト</returns>
    Task<FocusTaskResult> GetFocusTasksAsync(
        int userId,
        int focusTasksLimit = 5,
        int waitingTasksLimit = 5,
        FocusScorePriority focusScorePriority = FocusScorePriority.Deadline,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// やることリストのタスク取得サービス実装
/// </summary>
public class FocusTaskProvider : IFocusTaskProvider
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<FocusTaskProvider> _logger;

    /// <summary>
    /// FocusTaskProvider のコンストラクタ
    /// </summary>
    public FocusTaskProvider(
        ApplicationDbContext context,
        ILogger<FocusTaskProvider> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<FocusTaskResult> GetFocusTasksAsync(
        int userId,
        int focusTasksLimit = 5,
        int waitingTasksLimit = 5,
        FocusScorePriority focusScorePriority = FocusScorePriority.Deadline,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("やることリスト取得開始: UserId={UserId}", userId);

        var (priorityWeight, deadlineWeight, successorImpactWeight) =
            TaskScoreCalculator.GetWeights(focusScorePriority);

        // ユーザーの未完了タスクを取得（破棄済みは除外）
        var tasks = await _context.WorkspaceTasks
            .Include(t => t.WorkspaceItem)
                .ThenInclude(i => i.Workspace)
            .Include(t => t.TaskType)
            .Include(t => t.PredecessorTask!)
                .ThenInclude(p => p.WorkspaceItem)
            .Where(t => t.AssignedUserId == userId
                && !t.IsCompleted
                && !t.IsDiscarded)
            .ToListAsync(cancellationToken);

        _logger.LogDebug("対象タスク数: {Count}", tasks.Count);

        if (tasks.Count == 0)
        {
            return new FocusTaskResult
            {
                FocusTasks = new List<FocusTaskInfo>(),
                WaitingTasks = new List<FocusTaskInfo>(),
                TotalTaskCount = 0
            };
        }

        // 後続タスク数をカウント
        var taskIds = tasks.Select(t => t.Id).ToList();
        var successorCounts = await _context.WorkspaceTasks
            .Where(t => t.PredecessorTaskId != null
                && taskIds.Contains(t.PredecessorTaskId.Value)
                && !t.IsCompleted
                && !t.IsDiscarded)
            .GroupBy(t => t.PredecessorTaskId!.Value)
            .Select(g => new { TaskId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TaskId, x => x.Count, cancellationToken);

        // タスクをスコアリング
        var scoredTasks = tasks.Select(task =>
        {
            var successorCount = successorCounts.GetValueOrDefault(task.Id, 0);
            var totalScore = TaskScoreCalculator.CalculateTotalScore(
                task.Priority,
                task.DueDate,
                successorCount,
                priorityWeight,
                deadlineWeight,
                successorImpactWeight
            );
            var canStart = task.PredecessorTask == null || task.PredecessorTask.IsCompleted;

            return new FocusTaskInfo
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
                TaskTypeName = task.TaskType?.Name,
                Priority = task.Priority,
                DueDate = task.DueDate,
                EstimatedHours = task.EstimatedHours,
                ProgressPercentage = task.ProgressPercentage,
                TotalScore = totalScore,
                SuccessorCount = successorCount,
                CanStart = canStart,
                PredecessorItemCode = task.PredecessorTask?.WorkspaceItem.Code,
                PredecessorContent = task.PredecessorTask?.Content
            };
        }).ToList();

        // 着手可能タスク（スコア上位）
        var focusTasks = scoredTasks
            .Where(x => x.CanStart)
            .OrderByDescending(x => x.TotalScore)
            .Take(focusTasksLimit)
            .ToList();

        // 待機中タスク（先行タスク未完了、スコア順）
        var waitingTasks = scoredTasks
            .Where(x => !x.CanStart)
            .OrderByDescending(x => x.TotalScore)
            .Take(waitingTasksLimit)
            .ToList();

        _logger.LogDebug(
            "やることリスト取得完了: FocusTasks={FocusCount}, WaitingTasks={WaitingCount}",
            focusTasks.Count,
            waitingTasks.Count
        );

        return new FocusTaskResult
        {
            FocusTasks = focusTasks,
            WaitingTasks = waitingTasks,
            TotalTaskCount = tasks.Count
        };
    }
}
