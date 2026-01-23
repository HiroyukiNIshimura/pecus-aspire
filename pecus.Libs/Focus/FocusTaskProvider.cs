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

    /// <summary>
    /// ユーザーのやることリストを詳細情報付きで取得（API用）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="focusTasksLimit">着手可能タスクの上限（デフォルト: 5）</param>
    /// <param name="waitingTasksLimit">待機中タスクの上限（デフォルト: 5）</param>
    /// <param name="focusScorePriority">スコア計算の優先要素</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>詳細情報付きやることリスト</returns>
    Task<FocusTaskDetailResult> GetFocusTasksDetailAsync(
        int userId,
        int focusTasksLimit = 5,
        int waitingTasksLimit = 5,
        FocusScorePriority focusScorePriority = FocusScorePriority.Deadline,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// チームメンバーの手伝えそうなタスクを取得
    /// 期限が近い・ブロック中など、サポートが必要そうなタスクを返す
    /// </summary>
    /// <param name="currentUserId">現在のユーザーID（このユーザーのタスクは除外）</param>
    /// <param name="limit">取得数上限（デフォルト: 5）</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>手伝えそうなタスク一覧</returns>
    Task<FocusTaskResult> GetTeamTasksNeedingHelpAsync(
        int currentUserId,
        int limit = 5,
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

        // ユーザーの未完了タスクを取得（破棄済み、非アクティブ、アーカイブ済みは除外）
        var tasks = await _context.WorkspaceTasks
            .AsSplitQuery()
            .Include(t => t.WorkspaceItem)
                .ThenInclude(i => i.Workspace)
            .Include(t => t.TaskType)
            .Include(t => t.PredecessorTask!)
                .ThenInclude(p => p.WorkspaceItem)
            .Where(t => t.AssignedUserId == userId
                && !t.IsCompleted
                && !t.IsDiscarded
                && t.WorkspaceItem.IsActive
                && !t.WorkspaceItem.IsArchived
                && t.WorkspaceItem.Workspace != null
                && t.WorkspaceItem.Workspace.IsActive)
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

    /// <inheritdoc />
    public async Task<FocusTaskDetailResult> GetFocusTasksDetailAsync(
        int userId,
        int focusTasksLimit = 5,
        int waitingTasksLimit = 5,
        FocusScorePriority focusScorePriority = FocusScorePriority.Deadline,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("やることリスト（詳細）取得開始: UserId={UserId}", userId);

        var (priorityWeight, deadlineWeight, successorImpactWeight) =
            TaskScoreCalculator.GetWeights(focusScorePriority);

        // ユーザーの未完了タスクを取得（破棄済み、非アクティブ、アーカイブ済みは除外）
        // Genre情報も含める
        var tasks = await _context.WorkspaceTasks
            .AsSplitQuery()
            .Include(t => t.WorkspaceItem)
                .ThenInclude(i => i.Workspace)
                    .ThenInclude(w => w!.Genre)
            .Include(t => t.TaskType)
            .Include(t => t.PredecessorTask!)
                .ThenInclude(p => p.WorkspaceItem)
            .Where(t => t.AssignedUserId == userId
                && !t.IsCompleted
                && !t.IsDiscarded
                && t.WorkspaceItem.IsActive
                && !t.WorkspaceItem.IsArchived
                && t.WorkspaceItem.Workspace != null
                && t.WorkspaceItem.Workspace.IsActive)
            .ToListAsync(cancellationToken);

        _logger.LogDebug("対象タスク数: {Count}", tasks.Count);

        if (tasks.Count == 0)
        {
            return new FocusTaskDetailResult
            {
                FocusTasks = [],
                WaitingTasks = [],
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

        // 後続タスクの先頭1件を取得
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
            .ToDictionaryAsync(x => x.PredecessorTaskId, x => x.FirstSuccessor, cancellationToken);

        // タスクをスコアリング
        var scoredTasks = tasks.Select(task =>
        {
            var successorCount = successorCounts.GetValueOrDefault(task.Id, 0);
            var firstSuccessor = firstSuccessors.GetValueOrDefault(task.Id);

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

            var canStart = task.PredecessorTask == null || task.PredecessorTask.IsCompleted;

            return new FocusTaskDetailInfo
            {
                Task = task,
                TotalScore = totalScore,
                SuccessorCount = successorCount,
                FirstSuccessor = firstSuccessor,
                CanStart = canStart,
                ScoreDetail = new FocusScoreDetail
                {
                    PriorityScore = priorityScore,
                    DeadlineScore = deadlineScore,
                    SuccessorImpactScore = successorImpactScore,
                    PriorityWeight = priorityWeight,
                    DeadlineWeight = deadlineWeight,
                    SuccessorImpactWeight = successorImpactWeight,
                    Explanation = $"({priorityScore} × {priorityWeight}) + ({deadlineScore} × {deadlineWeight}) + ({successorImpactScore} × {successorImpactWeight}) = {totalScore}"
                }
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
            "やることリスト（詳細）取得完了: FocusTasks={FocusCount}, WaitingTasks={WaitingCount}",
            focusTasks.Count,
            waitingTasks.Count
        );

        return new FocusTaskDetailResult
        {
            FocusTasks = focusTasks,
            WaitingTasks = waitingTasks,
            TotalTaskCount = tasks.Count
        };
    }

    /// <inheritdoc />
    public async Task<FocusTaskResult> GetTeamTasksNeedingHelpAsync(
        int currentUserId,
        int limit = 5,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("チームの手伝えそうなタスク取得開始: CurrentUserId={UserId}", currentUserId);

        var now = DateTimeOffset.UtcNow;
        var nearDeadline = now.AddDays(3);

        // 現在のユーザーが所属するワークスペースを取得
        var userWorkspaceIds = await _context.WorkspaceUsers
            .Where(m => m.UserId == currentUserId)
            .Select(m => m.WorkspaceId)
            .ToListAsync(cancellationToken);

        if (userWorkspaceIds.Count == 0)
        {
            _logger.LogDebug("ユーザーが所属するワークスペースがありません");
            return new FocusTaskResult
            {
                FocusTasks = [],
                WaitingTasks = [],
                TotalTaskCount = 0
            };
        }

        // 他のメンバーのタスクで、期限が近い or ブロック中のものを取得
        // AssignedUserId != null チェックは nullable int との比較のため警告が出るが、
        // EF Core のクエリ変換では正しく動作するため抑制
#pragma warning disable CS0472
        var tasks = await _context.WorkspaceTasks
            .AsSplitQuery()
            .Include(t => t.WorkspaceItem)
                .ThenInclude(i => i.Workspace)
            .Include(t => t.TaskType)
            .Include(t => t.AssignedUser)
            .Include(t => t.PredecessorTask!)
                .ThenInclude(p => p.WorkspaceItem)
            .Where(t => t.AssignedUserId != currentUserId
                && t.AssignedUserId != null
                && !t.IsCompleted
                && !t.IsDiscarded
                && t.WorkspaceItem.IsActive
                && !t.WorkspaceItem.IsArchived
                && t.WorkspaceItem.Workspace != null
                && t.WorkspaceItem.Workspace.IsActive
                && userWorkspaceIds.Contains(t.WorkspaceId)
                && (t.DueDate <= nearDeadline || (t.PredecessorTask != null && !t.PredecessorTask.IsCompleted)))
            .OrderBy(t => t.DueDate)
            .Take(limit * 2) // ブロック中除外分を考慮して多めに取得
            .ToListAsync(cancellationToken);
#pragma warning restore CS0472

        _logger.LogDebug("対象タスク数: {Count}", tasks.Count);

        if (tasks.Count == 0)
        {
            return new FocusTaskResult
            {
                FocusTasks = [],
                WaitingTasks = [],
                TotalTaskCount = 0
            };
        }

        // タスクを変換
        var focusTasks = tasks
            .Where(t => t.PredecessorTask == null || t.PredecessorTask.IsCompleted)
            .Select(task => new FocusTaskInfo
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
                TotalScore = 0, // チームタスクはスコア計算不要
                SuccessorCount = 0,
                CanStart = true,
                AssignedUserName = task.AssignedUser?.Username
            })
            .Take(limit)
            .ToList();

        var waitingTasks = tasks
            .Where(t => t.PredecessorTask != null && !t.PredecessorTask.IsCompleted)
            .Select(task => new FocusTaskInfo
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
                TotalScore = 0,
                SuccessorCount = 0,
                CanStart = false,
                PredecessorItemCode = task.PredecessorTask?.WorkspaceItem.Code,
                PredecessorContent = task.PredecessorTask?.Content,
                AssignedUserName = task.AssignedUser?.Username
            })
            .Take(limit)
            .ToList();

        _logger.LogDebug(
            "チームタスク取得完了: FocusTasks={FocusCount}, WaitingTasks={WaitingCount}",
            focusTasks.Count,
            waitingTasks.Count
        );

        return new FocusTaskResult
        {
            FocusTasks = focusTasks,
            WaitingTasks = waitingTasks,
            TotalTaskCount = focusTasks.Count + waitingTasks.Count
        };
    }
}