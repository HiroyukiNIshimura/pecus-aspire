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
/// 先行タスク情報（内部用）
/// </summary>
file sealed record PredecessorInfo(int Id, bool IsCompleted, string? Content, string? ItemCode);

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

        // 後続タスク数をカウント（配列内に自身のIDを含むタスクをカウント）
        var taskIds = tasks.Select(t => t.Id).ToList();
        var successorCounts = await _context.WorkspaceTasks
            .Where(t => t.PredecessorTaskIds.Length > 0
                && t.PredecessorTaskIds.Any(pid => taskIds.Contains(pid))
                && !t.IsCompleted
                && !t.IsDiscarded)
            .SelectMany(t => t.PredecessorTaskIds)
            .Where(pid => taskIds.Contains(pid))
            .GroupBy(pid => pid)
            .Select(g => new { TaskId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TaskId, x => x.Count, cancellationToken);

        // 先行タスクIDをすべて収集
        var allPredecessorIds = tasks
            .SelectMany(t => t.PredecessorTaskIds)
            .Distinct()
            .ToList();

        // 先行タスクの完了状態を一括取得
        var predecessorCompletionMap = allPredecessorIds.Count > 0
            ? await _context.WorkspaceTasks
                .Where(t => allPredecessorIds.Contains(t.Id))
                .Select(t => new PredecessorInfo(t.Id, t.IsCompleted, t.Content, t.WorkspaceItem.Code))
                .ToDictionaryAsync(x => x.Id, cancellationToken)
            : new Dictionary<int, PredecessorInfo>();

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

            // 着手可能判定: 先行タスクがない、または全ての先行タスクが完了済み
            var canStart = task.PredecessorTaskIds.Length == 0
                || task.PredecessorTaskIds.All(pid =>
                    predecessorCompletionMap.TryGetValue(pid, out var pred) && pred.IsCompleted);

            // 先行タスク情報（最初の未完了先行タスクを表示用に取得）
            string? predecessorItemCode = null;
            string? predecessorContent = null;
            if (!canStart && task.PredecessorTaskIds.Length > 0)
            {
                var blockingPredecessor = task.PredecessorTaskIds
                    .Select(pid => predecessorCompletionMap.TryGetValue(pid, out var p) ? p : null)
                    .FirstOrDefault(p => p != null && !p.IsCompleted);
                if (blockingPredecessor != null)
                {
                    predecessorItemCode = blockingPredecessor.ItemCode;
                    predecessorContent = blockingPredecessor.Content;
                }
            }

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
                PredecessorItemCode = predecessorItemCode,
                PredecessorContent = predecessorContent
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

        // 後続タスク数をカウント（配列内に自身のIDを含むタスクをカウント）
        var taskIds = tasks.Select(t => t.Id).ToList();
        var successorCounts = await _context.WorkspaceTasks
            .Where(t => t.PredecessorTaskIds.Length > 0
                && t.PredecessorTaskIds.Any(pid => taskIds.Contains(pid))
                && !t.IsCompleted
                && !t.IsDiscarded)
            .SelectMany(t => t.PredecessorTaskIds)
            .Where(pid => taskIds.Contains(pid))
            .GroupBy(pid => pid)
            .Select(g => new { TaskId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TaskId, x => x.Count, cancellationToken);

        // 後続タスクの先頭1件を取得（配列内に自身のIDを含むタスク）
        var firstSuccessors = await _context.WorkspaceTasks
            .Include(t => t.WorkspaceItem)
            .Where(t => t.PredecessorTaskIds.Length > 0
                && t.PredecessorTaskIds.Any(pid => taskIds.Contains(pid))
                && !t.IsCompleted
                && !t.IsDiscarded)
            .SelectMany(t => t.PredecessorTaskIds.Select(pid => new { PredecessorId = pid, Successor = t }))
            .Where(x => taskIds.Contains(x.PredecessorId))
            .GroupBy(x => x.PredecessorId)
            .Select(g => new
            {
                PredecessorTaskId = g.Key,
                FirstSuccessor = g.OrderBy(x => x.Successor.Id).First().Successor
            })
            .ToDictionaryAsync(x => x.PredecessorTaskId, x => x.FirstSuccessor, cancellationToken);

        // 先行タスクIDをすべて収集
        var allPredecessorIds = tasks
            .SelectMany(t => t.PredecessorTaskIds)
            .Distinct()
            .ToList();

        // 先行タスクの完了状態を一括取得
        var predecessorCompletionMap = allPredecessorIds.Count > 0
            ? await _context.WorkspaceTasks
                .Where(t => allPredecessorIds.Contains(t.Id))
                .Select(t => new { t.Id, t.IsCompleted })
                .ToDictionaryAsync(x => x.Id, x => x.IsCompleted, cancellationToken)
            : new Dictionary<int, bool>();

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

            // 着手可能判定: 先行タスクがない、または全ての先行タスクが完了済み
            var canStart = task.PredecessorTaskIds.Length == 0
                || task.PredecessorTaskIds.All(pid =>
                    predecessorCompletionMap.TryGetValue(pid, out var isCompleted) && isCompleted);

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

        // 他のメンバーのタスクで、期限が近い or 先行タスクがあるものを取得
        // AssignedUserId != null チェックは nullable int との比較のため警告が出るが、
        // EF Core のクエリ変換では正しく動作するため抑制
#pragma warning disable CS0472
        var tasks = await _context.WorkspaceTasks
            .AsSplitQuery()
            .Include(t => t.WorkspaceItem)
                .ThenInclude(i => i.Workspace)
            .Include(t => t.TaskType)
            .Include(t => t.AssignedUser)
            .Where(t => t.AssignedUserId != currentUserId
                && t.AssignedUserId != null
                && !t.IsCompleted
                && !t.IsDiscarded
                && t.WorkspaceItem.IsActive
                && !t.WorkspaceItem.IsArchived
                && t.WorkspaceItem.Workspace != null
                && t.WorkspaceItem.Workspace.IsActive
                && userWorkspaceIds.Contains(t.WorkspaceId)
                && (t.DueDate <= nearDeadline || t.PredecessorTaskIds.Length > 0))
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

        // 先行タスクIDをすべて収集
        var allPredecessorIds = tasks
            .SelectMany(t => t.PredecessorTaskIds)
            .Distinct()
            .ToList();

        // 先行タスクの完了状態と情報を一括取得
        var predecessorInfoMap = allPredecessorIds.Count > 0
            ? await _context.WorkspaceTasks
                .Include(t => t.WorkspaceItem)
                .Where(t => allPredecessorIds.Contains(t.Id))
                .ToDictionaryAsync(t => t.Id, cancellationToken)
            : new Dictionary<int, DB.Models.WorkspaceTask>();

        // 着手可能判定用のヘルパー関数
        bool CanStartTask(DB.Models.WorkspaceTask task)
        {
            return task.PredecessorTaskIds.Length == 0
                || task.PredecessorTaskIds.All(pid =>
                    predecessorInfoMap.TryGetValue(pid, out var pred) && pred.IsCompleted);
        }

        // 最初の未完了先行タスクを取得するヘルパー関数
        DB.Models.WorkspaceTask? GetBlockingPredecessor(DB.Models.WorkspaceTask task)
        {
            return task.PredecessorTaskIds
                .Select(pid => predecessorInfoMap.TryGetValue(pid, out var p) ? p : null)
                .FirstOrDefault(p => p != null && !p.IsCompleted);
        }

        // タスクを変換
        var focusTasks = tasks
            .Where(CanStartTask)
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
            .Where(t => !CanStartTask(t))
            .Select(task =>
            {
                var blockingPredecessor = GetBlockingPredecessor(task);
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
                    TotalScore = 0,
                    SuccessorCount = 0,
                    CanStart = false,
                    PredecessorItemCode = blockingPredecessor?.WorkspaceItem.Code,
                    PredecessorContent = blockingPredecessor?.Content,
                    AssignedUserName = task.AssignedUser?.Username
                };
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