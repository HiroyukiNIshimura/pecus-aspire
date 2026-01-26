using Hangfire;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Models.Config;
using Pecus.Models.Enums;

namespace Pecus.Services;

/// <summary>
/// ワークスペースタスクサービス
/// </summary>
public class WorkspaceTaskService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkspaceTaskService> _logger;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly SignalRPresenceService _presenceService;

    public WorkspaceTaskService(
        ApplicationDbContext context,
        ILogger<WorkspaceTaskService> logger,
        OrganizationAccessHelper accessHelper,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient,
        SignalRPresenceService presenceService
    )
    {
        _context = context;
        _logger = logger;
        _accessHelper = accessHelper;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
        _presenceService = presenceService;
    }

    /// <summary>
    /// ワークスペースタスクを作成
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">作成リクエスト</param>
    /// <param name="createdByUserId">作成者ユーザーID</param>
    /// <returns>作成されたタスク</returns>
    public async Task<WorkspaceTask> CreateWorkspaceTaskAsync(
        int workspaceId,
        int itemId,
        CreateWorkspaceTaskRequest request,
        int createdByUserId
    )
    {
        // ワークスペースアイテムの存在確認
        var workspaceItem = await _context.WorkspaceItems
            .Include(wi => wi.Workspace)
            .FirstOrDefaultAsync(wi => wi.Id == itemId && wi.WorkspaceId == workspaceId);

        if (workspaceItem == null)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        // ワークスペースの組織IDを取得
        var organizationId = workspaceItem.Workspace!.OrganizationId;

        // 担当者がワークスペースのメンバーか確認
        var isAssigneeMember = await _accessHelper.IsActiveWorkspaceMemberAsync(
            request.AssignedUserId,
            workspaceId
        );
        if (!isAssigneeMember)
        {
            throw new InvalidOperationException(
                "担当者はワークスペースのアクティブなメンバーである必要があります。"
            );
        }

        // 先行タスクのバリデーション
        if (request.PredecessorTaskId.HasValue)
        {
            var predecessorTask = await _context.WorkspaceTasks
                .FirstOrDefaultAsync(t => t.Id == request.PredecessorTaskId.Value && t.WorkspaceId == workspaceId);

            if (predecessorTask == null)
            {
                throw new InvalidOperationException("指定された先行タスクが見つかりません。");
            }
        }

        // タスクを挿入
        // シーケンス番号はワークスペースアイテム内での最大値＋1を設定
        // 楽観的ロック用にxminも取得
        // FromSqlでINSERT文を実行し、RETURNINGでxminを含むすべてのカラムを戻す必要あり
        var inserted = await _context.WorkspaceTasks
            .FromSql($@"
                INSERT INTO ""WorkspaceTasks"" (
                    ""WorkspaceItemId"",
                    ""WorkspaceId"",
                    ""OrganizationId"",
                    ""Sequence"",
                    ""AssignedUserId"",
                    ""CreatedByUserId"",
                    ""Content"",
                    ""TaskTypeId"",
                    ""Priority"",
                    ""StartDate"",
                    ""DueDate"",
                    ""EstimatedHours"",
                    ""PredecessorTaskId"",
                    ""CreatedAt"",
                    ""UpdatedAt""
                )
                VALUES (
                    {itemId},
                    {workspaceId},
                    {organizationId},
                    (SELECT COALESCE(MAX(""Sequence""), 0) + 1 FROM ""WorkspaceTasks"" WHERE ""WorkspaceItemId"" = {itemId}),
                    {request.AssignedUserId},
                    {createdByUserId},
                    {request.Content},
                    {request.TaskTypeId},
                    {(request.Priority.HasValue ? (int)request.Priority.Value : TaskPriority.Medium)},
                    {request.StartDate},
                    {request.DueDate},
                    {request.EstimatedHours},
                    {request.PredecessorTaskId},
                    {DateTime.UtcNow},
                    {DateTime.UtcNow}
                )
                RETURNING ""xmin"", ""Id"", ""WorkspaceItemId"", ""WorkspaceId"", ""OrganizationId"", ""Sequence"", ""AssignedUserId"", ""CreatedByUserId"", ""CompletedByUserId"",""Content"", ""TaskTypeId"", ""Priority"", ""StartDate"", ""DueDate"", ""EstimatedHours"", ""PredecessorTaskId"", ""IsCompleted"", ""CompletedAt"", ""IsDiscarded"", ""DiscardedAt"", ""DiscardReason"", ""ActualHours"", ""ProgressPercentage"", ""CreatedAt"", ""UpdatedAt""
            ")
            .ToListAsync();

        _context.SaveChanges();

        // ナビゲーションプロパティを読み込み
        var task = await _context.WorkspaceTasks
        .Include(t => t.AssignedUser)
        .Include(t => t.CreatedByUser)
        .Include(t => t.CompletedByUser)
        .Include(t => t.TaskType)
        .FirstAsync(t => t.Id == inserted.FirstOrDefault()!.Id);

        // アクティビティ記録: タスク追加
        var taskAddedDetails = ActivityDetailsBuilder.BuildTaskAddedDetails(
            task.Id,
            task.Content,
            task.AssignedUser?.Username
        );
        _backgroundJobClient.Enqueue<ActivityTasks>(x =>
            x.RecordActivityAsync(workspaceId, itemId, createdByUserId, ActivityActionType.TaskAdded, taskAddedDetails)
        );

        return task;
    }

    /// <summary>
    /// 担当者の期限日別タスク負荷をチェック
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">チェックリクエスト</param>
    /// <returns>負荷情報</returns>
    public async Task<AssigneeTaskLoadResponse> CheckAssigneeTaskLoadAsync(
        int workspaceId,
        int itemId,
        CheckAssigneeTaskLoadRequest request
    )
    {
        var workspaceItem = await _context.WorkspaceItems
            .Include(wi => wi.Workspace!)
                .ThenInclude(w => w.Organization!)
                    .ThenInclude(o => o.Setting)
            .FirstOrDefaultAsync(wi => wi.Id == itemId && wi.WorkspaceId == workspaceId);

        if (workspaceItem == null)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var workspace = workspaceItem.Workspace
            ?? throw new InvalidOperationException("ワークスペース情報が見つかりません。");

        var organization = workspace.Organization
            ?? throw new InvalidOperationException("組織情報が見つかりません。");

        // 設定が未ロード／未設定の場合に備えフェッチしてしきい値を取得
        var threshold = organization.Setting?.TaskOverdueThreshold
            ?? await _context.OrganizationSettings
                .Where(s => s.OrganizationId == organization.Id)
                .Select(s => (int?)s.TaskOverdueThreshold)
                .FirstOrDefaultAsync()
            ?? 0;

        // 期限日（クライアント指定のオフセットを保持したまま日単位で集計）
        // Date をそのまま使うと Offset 情報が保持され、同一ローカル日で集計可能
        var localDate = request.DueDate.Date;
        var startOfDay = new DateTimeOffset(localDate, request.DueDate.Offset).ToUniversalTime();
        var endOfDay = startOfDay.AddDays(1);

        var activeTaskCount = await _context.WorkspaceTasks
            .Where(t => t.OrganizationId == organization.Id)
            .Where(t => t.AssignedUserId == request.AssignedUserId)
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .Where(t => t.DueDate >= startOfDay && t.DueDate < endOfDay)
            .CountAsync();

        var projectedTaskCount = activeTaskCount + 1;
        var isExceeded = threshold > 0 && projectedTaskCount > threshold;

        return new AssigneeTaskLoadResponse
        {
            AssignedUserId = request.AssignedUserId,
            DueDate = startOfDay,
            Threshold = threshold,
            ActiveTaskCount = activeTaskCount,
            ProjectedTaskCount = projectedTaskCount,
            IsExceeded = isExceeded,
        };
    }

    /// <summary>
    /// ワークスペースタスクを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <returns>タスクとコメント情報のタプル</returns>
    public async Task<(WorkspaceTask Task, int CommentCount, Dictionary<TaskCommentType, int> CommentTypeCounts)> GetWorkspaceTaskAsync(
        int workspaceId,
        int itemId,
        int taskId
    )
    {
        var task = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi!.Owner)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi!.Assignee)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi!.Committer)
            .AsSplitQuery()
            .FirstOrDefaultAsync(t =>
                t.Id == taskId &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (task == null)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var commentTypeCountsByTask = await GetCommentTypeCountsByTaskIdsAsync(new[] { taskId });
        var commentTypeCounts = commentTypeCountsByTask.GetValueOrDefault(taskId, new Dictionary<TaskCommentType, int>());
        var commentCount = SumCommentCounts(commentTypeCounts);

        return (task, commentCount, commentTypeCounts);
    }

    /// <summary>
    /// シーケンス番号でタスクを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="sequence">タスクシーケンス番号</param>
    /// <returns>タスクとコメント情報のタプル</returns>
    public async Task<(WorkspaceTask Task, int CommentCount, Dictionary<TaskCommentType, int> CommentTypeCounts)> GetWorkspaceTaskBySequenceAsync(
        int workspaceId,
        int itemId,
        int sequence
    )
    {
        var task = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi!.Owner)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi!.Assignee)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi!.Committer)
            .AsSplitQuery()
            .FirstOrDefaultAsync(t =>
                t.Sequence == sequence &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (task == null)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var commentTypeCountsByTask = await GetCommentTypeCountsByTaskIdsAsync(new[] { task.Id });
        var commentTypeCounts = commentTypeCountsByTask.GetValueOrDefault(task.Id, new Dictionary<TaskCommentType, int>());
        var commentCount = SumCommentCounts(commentTypeCounts);

        return (task, commentCount, commentTypeCounts);
    }

    /// <summary>
    /// ワークスペースアイテムのタスク一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">フィルタリング・ページネーションリクエスト</param>
    /// <returns>タスク一覧、コメント情報辞書、総件数のタプル</returns>
    public async Task<(
        List<WorkspaceTask> Tasks,
        Dictionary<int, int> CommentCounts,
        Dictionary<int, Dictionary<TaskCommentType, int>> CommentTypeCounts,
        int TotalCount
    )> GetWorkspaceTasksAsync(
        int workspaceId,
        int itemId,
        GetWorkspaceTasksRequest request
    )
    {
        // ワークスペースアイテムの存在確認
        var itemExists = await _context.WorkspaceItems
            .AnyAsync(wi => wi.Id == itemId && wi.WorkspaceId == workspaceId);

        if (!itemExists)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var query = _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .Include(t => t.PredecessorTask)
            .Where(t => t.WorkspaceItemId == itemId && t.WorkspaceId == workspaceId);

        // ステータスフィルタ
        if (request.Status.HasValue)
        {
            query = request.Status.Value switch
            {
                TaskStatusFilter.Active => query.Where(t => !t.IsCompleted && !t.IsDiscarded),
                TaskStatusFilter.Completed => query.Where(t => t.IsCompleted && !t.IsDiscarded),
                TaskStatusFilter.Discarded => query.Where(t => t.IsDiscarded),
                _ => query, // All の場合はフィルタなし
            };
        }

        // 担当者フィルタ
        if (request.AssignedUserId.HasValue)
        {
            query = query.Where(t => t.AssignedUserId == request.AssignedUserId.Value);
        }

        // 総件数を取得
        var totalCount = await query.CountAsync();

        // ソート処理
        var sortBy = request.SortBy ?? TaskSortBy.Sequence;
        var order = request.Order ?? SortOrder.Asc;

        query = sortBy switch
        {
            TaskSortBy.Sequence => order == SortOrder.Asc
                ? query.OrderBy(t => t.Sequence)
                : query.OrderByDescending(t => t.Sequence),
            TaskSortBy.Priority => order == SortOrder.Asc
                ? query.OrderBy(t => t.Priority).ThenBy(t => t.Sequence)
                : query.OrderByDescending(t => t.Priority).ThenBy(t => t.Sequence),
            TaskSortBy.DueDate => order == SortOrder.Asc
                ? query.OrderBy(t => t.DueDate).ThenBy(t => t.Sequence)
                : query.OrderByDescending(t => t.DueDate).ThenBy(t => t.Sequence),
            _ => query.OrderBy(t => t.Sequence),
        };

        // ページネーション
        var pageSize = request.PageSize;
        var tasks = await query
            .Skip((request.Page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 各タスクのコメント件数を取得（タイプ別内訳を含む）
        var taskIds = tasks.Select(t => t.Id).ToList();
        var commentTypeCounts = await GetCommentTypeCountsByTaskIdsAsync(taskIds);
        var commentCounts = commentTypeCounts.ToDictionary(
            kvp => kvp.Key,
            kvp => SumCommentCounts(kvp.Value)
        );

        return (tasks, commentCounts, commentTypeCounts, totalCount);
    }

    /// <summary>
    /// ワークスペースタスクの統計情報を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <returns>統計情報</returns>
    public async Task<WorkspaceTaskStatistics> GetWorkspaceTaskStatisticsAsync(
        int workspaceId,
        int itemId
    )
    {
        // DateTimeOffset で日付範囲を定義（PostgreSQL との互換性のため）
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var todayEnd = todayStart.AddDays(1);
        var sevenDaysLaterEnd = todayStart.AddDays(8); // 7日後の終わりまで

        var query = _context.WorkspaceTasks
            .Where(t => t.WorkspaceItemId == itemId && t.WorkspaceId == workspaceId);

        // 各統計値を計算
        var totalCount = await query.CountAsync();
        var completedCount = await query.CountAsync(t => t.IsCompleted && !t.IsDiscarded);
        var incompleteCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded);
        var overdueCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart);
        var dueTodayCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate >= todayStart && t.DueDate < todayEnd);
        var dueSoonCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate >= todayEnd && t.DueDate < sevenDaysLaterEnd);
        var discardedCount = await query.CountAsync(t => t.IsDiscarded);

        // タスクに紐づくコメント総数
        var taskIds = await query.Select(t => t.Id).ToListAsync();
        var commentCount = taskIds.Count > 0
            ? await _context.TaskComments.CountAsync(c => taskIds.Contains(c.WorkspaceTaskId))
            : 0;

        return new WorkspaceTaskStatistics
        {
            TotalCount = totalCount,
            CompletedCount = completedCount,
            IncompleteCount = incompleteCount,
            OverdueCount = overdueCount,
            DueTodayCount = dueTodayCount,
            DueSoonCount = dueSoonCount,
            DiscardedCount = discardedCount,
            CommentCount = commentCount,
        };
    }

    /// <summary>
    /// ワークスペースタスクを更新
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="request">更新リクエスト</param>
    /// <param name="currentUserId">操作ユーザーID</param>
    /// <returns>更新されたタスク、変更前のタスク、コメント情報のタプル</returns>
    public async Task<(
        WorkspaceTask Task,
        WorkspaceTaskDetailResponse PreviousTask,
        int CommentCount,
        Dictionary<TaskCommentType, int> CommentTypeCounts
    )> UpdateWorkspaceTaskAsync(
        int workspaceId,
        int itemId,
        int taskId,
        UpdateWorkspaceTaskRequest request,
        int currentUserId
    )
    {
        var task = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .FirstOrDefaultAsync(t =>
                t.Id == taskId &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (task == null)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        // 変更前のタスク情報をDTOとして保持（コメント数は更新APIでは不要なので0）
        var previousTaskDto = BuildTaskDetailResponse(task);

        // アクティビティ記録用のスナップショット
        var snapshot = new
        {
            IsCompleted = task.IsCompleted,
            IsDiscarded = task.IsDiscarded,
            Content = task.Content,
            AssignedUserId = task.AssignedUserId,
            AssigneeName = task.AssignedUser?.Username,
            DueDate = task.DueDate
        };

        // 他ユーザーの編集中は更新を拒否
        var taskEditor = await _presenceService.GetTaskEditorAsync(taskId);
        if (taskEditor != null && taskEditor.UserId != currentUserId)
        {
            throw new InvalidOperationException(
                $"{taskEditor.UserName} さんが編集中のため更新できません。"
            );
        }

        // 担当者が変更される場合、新しい担当者がワークスペースのメンバーか確認
        if (request.AssignedUserId.HasValue && request.AssignedUserId.Value != task.AssignedUserId)
        {
            var isAssigneeMember = await _accessHelper.IsActiveWorkspaceMemberAsync(
                request.AssignedUserId.Value,
                workspaceId
            );
            if (!isAssigneeMember)
            {
                throw new InvalidOperationException(
                    "担当者はワークスペースのアクティブなメンバーである必要があります。"
                );
            }
            task.AssignedUserId = request.AssignedUserId.Value;
        }

        // 各フィールドを更新（nullでない場合のみ）
        if (request.Content != null)
        {
            task.Content = request.Content;
        }

        if (request.TaskTypeId.HasValue)
        {
            task.TaskTypeId = request.TaskTypeId.Value;
        }

        if (request.Priority.HasValue)
        {
            task.Priority = request.Priority.Value;
        }

        if (request.StartDate.HasValue)
        {
            task.StartDate = request.StartDate.Value;
        }

        // DueDateは必須なので常に更新
        task.DueDate = request.DueDate;

        if (request.EstimatedHours.HasValue)
        {
            task.EstimatedHours = request.EstimatedHours.Value;
        }

        if (request.ActualHours.HasValue)
        {
            task.ActualHours = request.ActualHours.Value;
        }

        if (request.ProgressPercentage.HasValue)
        {
            task.ProgressPercentage = request.ProgressPercentage.Value;
        }

        if (request.IsCompleted.HasValue)
        {
            task.IsCompleted = request.IsCompleted.Value;
            if (request.IsCompleted.Value && !task.CompletedAt.HasValue)
            {
                task.CompletedAt = DateTime.UtcNow;
                task.CompletedByUserId = currentUserId;
            }
            else if (!request.IsCompleted.Value)
            {
                task.CompletedAt = null;
                task.CompletedByUserId = null;
            }
        }

        if (request.IsDiscarded.HasValue)
        {
            task.IsDiscarded = request.IsDiscarded.Value;
            if (request.IsDiscarded.Value && !task.DiscardedAt.HasValue)
            {
                task.DiscardedAt = DateTime.UtcNow;
            }
            else if (!request.IsDiscarded.Value)
            {
                task.DiscardedAt = null;
                task.DiscardReason = null;
            }
        }

        if (request.DiscardReason != null)
        {
            task.DiscardReason = request.DiscardReason;
        }

        // 先行タスクの更新
        if (request.ClearPredecessorTask)
        {
            task.PredecessorTaskId = null;
        }
        else if (request.PredecessorTaskId.HasValue)
        {
            // 自己参照チェック
            if (request.PredecessorTaskId.Value == task.Id)
            {
                throw new InvalidOperationException("タスクは自身を先行タスクに設定できません。");
            }

            // 先行タスクの存在確認
            var predecessorTask = await _context.WorkspaceTasks
                .FirstOrDefaultAsync(t => t.Id == request.PredecessorTaskId.Value && t.WorkspaceId == workspaceId);

            if (predecessorTask == null)
            {
                throw new InvalidOperationException("指定された先行タスクが見つかりません。");
            }

            // 循環参照チェック
            if (await HasCircularDependencyAsync(task.Id, request.PredecessorTaskId.Value))
            {
                throw new InvalidOperationException("先行タスクの設定により循環参照が発生します。");
            }

            task.PredecessorTaskId = request.PredecessorTaskId.Value;
        }

        task.UpdatedAt = DateTime.UtcNow;

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(task).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            var latestTask = await _context.WorkspaceTasks
                .Include(t => t.AssignedUser)
                .Include(t => t.CreatedByUser)
                .Include(t => t.CompletedByUser)
                .Include(t => t.TaskType)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            var latestCommentTypeCounts = await GetCommentTypeCountsByTaskIdsAsync(new[] { taskId });
            var latestTypeCounts = latestCommentTypeCounts.GetValueOrDefault(taskId, new Dictionary<TaskCommentType, int>());
            var latestCommentCount = SumCommentCounts(latestTypeCounts);

            throw new ConcurrencyException<WorkspaceTaskDetailResponse>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestTask != null
                    ? BuildTaskDetailResponse(latestTask, commentCount: latestCommentCount, commentTypeCounts: latestTypeCounts)
                    : null
            );
        }

        _logger.LogDebug(
            "ワークスペースタスクを更新しました。TaskId={TaskId}, WorkspaceItemId={WorkspaceItemId}",
            task.Id,
            itemId
        );

        // アクティビティ記録: タスク完了（未完了→完了に変更された場合のみ）
        if (!snapshot.IsCompleted && task.IsCompleted)
        {
            // 操作ユーザー名を取得
            var currentUser = await _context.Users.FindAsync(currentUserId);
            var completedByName = currentUser?.Username ?? "不明";

            var taskCompletedDetails = ActivityDetailsBuilder.BuildTaskCompletedDetails(
                task.Id,
                snapshot.Content,
                snapshot.AssigneeName,
                completedByName
            );
            _backgroundJobClient.Enqueue<ActivityTasks>(x =>
                x.RecordActivityAsync(workspaceId, itemId, currentUserId, ActivityActionType.TaskCompleted, taskCompletedDetails)
            );
        }

        // アクティビティ記録: タスク破棄（未破棄→破棄に変更された場合のみ）
        if (!snapshot.IsDiscarded && task.IsDiscarded)
        {
            // 操作ユーザー名を取得
            var currentUser = await _context.Users.FindAsync(currentUserId);
            var discardedByName = currentUser?.Username ?? "不明";

            var taskDiscardedDetails = ActivityDetailsBuilder.BuildTaskDiscardedDetails(
                task.Id,
                snapshot.Content,
                snapshot.AssigneeName,
                discardedByName
            );
            _backgroundJobClient.Enqueue<ActivityTasks>(x =>
                x.RecordActivityAsync(workspaceId, itemId, currentUserId, ActivityActionType.TaskDiscarded, taskDiscardedDetails)
            );
        }

        // アクティビティ記録: タスク担当者変更
        if (snapshot.AssignedUserId != task.AssignedUserId)
        {
            // 新しい担当者名を取得（AssignedUserがロード済みならそれを使う、なければ取得）
            string? newAssigneeName = task.AssignedUser?.Username;
            if (newAssigneeName == null && task.AssignedUserId != 0)
            {
                var newAssignee = await _context.Users.FindAsync(task.AssignedUserId);
                newAssigneeName = newAssignee?.Username;
            }

            var taskAssigneeChangedDetails = ActivityDetailsBuilder.BuildTaskAssigneeChangedDetails(
                task.Id,
                snapshot.Content,
                snapshot.AssigneeName,
                snapshot.AssignedUserId == 0 ? null : snapshot.AssignedUserId,
                newAssigneeName,
                task.AssignedUserId == 0 ? null : task.AssignedUserId
            );

            if (taskAssigneeChangedDetails != null)
            {
                _backgroundJobClient.Enqueue<ActivityTasks>(x =>
                    x.RecordActivityAsync(workspaceId, itemId, currentUserId, ActivityActionType.TaskAssigneeChanged, taskAssigneeChangedDetails)
                );
            }
        }

        // アクティビティ記録: タスク再開（完了→未完了に戻された場合のみ）
        if (snapshot.IsCompleted && !task.IsCompleted)
        {
            // 操作ユーザー名を取得
            var currentUser = await _context.Users.FindAsync(currentUserId);
            var reopenedByName = currentUser?.Username ?? "不明";

            var taskReopenedDetails = ActivityDetailsBuilder.BuildTaskReopenedDetails(
                task.Id,
                snapshot.Content,
                snapshot.AssigneeName,
                reopenedByName
            );
            _backgroundJobClient.Enqueue<ActivityTasks>(x =>
                x.RecordActivityAsync(workspaceId, itemId, currentUserId, ActivityActionType.TaskReopened, taskReopenedDetails)
            );
        }

        // アクティビティ記録: タスク期限変更
        if (snapshot.DueDate != task.DueDate)
        {
            var taskDueDateChangedDetails = ActivityDetailsBuilder.BuildTaskDueDateChangedDetails(
                task.Id,
                snapshot.Content,
                snapshot.DueDate,
                task.DueDate
            );
            _backgroundJobClient.Enqueue<ActivityTasks>(x =>
                x.RecordActivityAsync(workspaceId, itemId, currentUserId, ActivityActionType.TaskDueDateChanged, taskDueDateChangedDetails)
            );
        }

        // ナビゲーションプロパティを再読み込み（担当者またはタスク種類が変更された場合）
        if (request.AssignedUserId.HasValue)
        {
            await _context.Entry(task)
                .Reference(t => t.AssignedUser)
                .LoadAsync();
        }
        if (request.TaskTypeId.HasValue)
        {
            await _context.Entry(task)
                .Reference(t => t.TaskType)
                .LoadAsync();
        }

        // コメント数とタイプ別件数を取得
        var commentTypeCountsByTask = await GetCommentTypeCountsByTaskIdsAsync(new[] { taskId });
        var commentTypeCounts = commentTypeCountsByTask.GetValueOrDefault(taskId, new Dictionary<TaskCommentType, int>());
        var commentCount = SumCommentCounts(commentTypeCounts);

        return (task, previousTaskDto, commentCount, commentTypeCounts);
    }

    /// <summary>
    /// コミッタIDでアイテムとタスクを取得（ワークスペース単位）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="committerId">コミッタID</param>
    /// <param name="page">ページ番号</param>
    /// <returns>アイテムとタスクのリスト、総件数、ページサイズのタプル</returns>
    public async Task<(List<(WorkspaceItem Item, List<WorkspaceTask> Tasks)> Results, int TotalCount, int PageSize)> GetTasksByCommitterAsync(
        int? workspaceId,
        int committerId,
        int page
    )
    {
        // 設定からページサイズを取得
        var pageSize = _config.Pagination.DefaultPageSize;

        // コミッタIDに一致するワークスペースアイテムを取得
        var itemsQuery = _context.WorkspaceItems
            .Include(wi => wi.Workspace!)
                .ThenInclude(w => w.Genre)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Where(wi => wi.CommitterId == committerId);

        // WorkspaceIdが指定されている場合はフィルタ追加
        if (workspaceId.HasValue)
        {
            itemsQuery = itemsQuery.Where(wi => wi.WorkspaceId == workspaceId.Value);
        }

        itemsQuery = itemsQuery.OrderByDescending(wi => wi.UpdatedAt);

        // 総件数を取得
        var totalCount = await itemsQuery.CountAsync();

        // ページネーション適用
        var items = await itemsQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 各アイテムのIDを抽出
        var itemIds = items.Select(i => i.Id).ToList();

        // アイテムIDに紐づくタスクを一括取得
        var tasks = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .Where(t => itemIds.Contains(t.WorkspaceItemId))
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        // アイテムごとにタスクをグループ化
        var tasksByItem = tasks.GroupBy(t => t.WorkspaceItemId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 結果を構築
        var results = items.Select(item => (
            Item: item,
            Tasks: tasksByItem.ContainsKey(item.Id) ? tasksByItem[item.Id] : new List<WorkspaceTask>()
        )).ToList();

        return (results, totalCount, pageSize);
    }

    /// <summary>
    /// WorkspaceItemエンティティからレスポンスを生成（内部ヘルパー）
    /// </summary>
    /// <param name="item">アイテムエンティティ</param>
    private static WorkspaceItemDetailResponse BuildItemDetailResponse(WorkspaceItem item)
    {
        return new WorkspaceItemDetailResponse
        {
            Id = item.Id,
            WorkspaceId = item.WorkspaceId,
            WorkspaceCode = item.Workspace?.Code,
            WorkspaceName = item.Workspace?.Name,
            GenreIcon = item.Workspace?.Genre?.Icon,
            GenreName = item.Workspace?.Genre?.Name,
            WorkspaceMode = item.Workspace?.Mode,
            Code = item.Code,
            Subject = item.Subject,
            Body = item.Body,
            Owner = UserIdentityResponseBuilder.FromUserWithId(item.OwnerId, item.Owner),
            Assignee = UserIdentityResponseBuilder.FromNullableUserWithId(item.AssigneeId, item.Assignee),
            Priority = item.Priority,
            DueDate = item.DueDate,
            IsArchived = item.IsArchived,
            IsDraft = item.IsDraft,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
            RowVersion = item.RowVersion!,
        };
    }

    /// <summary>
    /// WorkspaceTaskエンティティからレスポンスを生成（内部ヘルパー）
    /// </summary>
    /// <param name="task">タスクエンティティ</param>
    /// <param name="listIndex">リスト内でのインデックス（Reactのkey用）</param>
    /// <param name="commentCount">コメント数</param>
    /// <param name="commentTypeCounts">コメントタイプ別件数</param>
    /// <param name="predecessorInfo">先行タスク情報</param>
    /// <param name="successorTaskCount">後続タスク数</param>
    private static WorkspaceTaskDetailResponse BuildTaskDetailResponse(
        WorkspaceTask task,
        int listIndex = 0,
        int commentCount = 0,
        Dictionary<TaskCommentType, int>? commentTypeCounts = null,
        PredecessorTaskInfo? predecessorInfo = null,
        int successorTaskCount = 0
    )
    {
        return new WorkspaceTaskDetailResponse
        {
            ListIndex = listIndex,
            Id = task.Id,
            WorkspaceItemId = task.WorkspaceItemId,
            Sequence = task.Sequence,
            WorkspaceId = task.WorkspaceId,
            OrganizationId = task.OrganizationId,
            // アイテム権限情報（タスク編集権限チェック用）
            ItemOwner = UserIdentityResponseBuilder.FromUserWithId(task.WorkspaceItem?.OwnerId ?? 0, task.WorkspaceItem?.Owner),
            ItemAssignee = UserIdentityResponseBuilder.FromNullableUserWithId(task.WorkspaceItem?.AssigneeId, task.WorkspaceItem?.Assignee),
            ItemCommitter = UserIdentityResponseBuilder.FromNullableUserWithId(task.WorkspaceItem?.CommitterId, task.WorkspaceItem?.Committer),
            CompletedBy = UserIdentityResponseBuilder.FromNullableUserWithId(task.CompletedByUserId, task.CompletedByUser),
            CreatedBy = UserIdentityResponseBuilder.FromUserWithId(task.CreatedByUserId, task.CreatedByUser),
            Assigned = UserIdentityResponseBuilder.FromUserWithId(task.AssignedUserId, task.AssignedUser),
            Content = task.Content,
            TaskTypeId = task.TaskTypeId,
            TaskTypeCode = task.TaskType?.Code,
            TaskTypeName = task.TaskType?.Name,
            TaskTypeIcon = task.TaskType?.Icon,
            Priority = task.Priority,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedHours = task.EstimatedHours,
            ActualHours = task.ActualHours,
            ProgressPercentage = task.ProgressPercentage,
            IsCompleted = task.IsCompleted,
            CompletedAt = task.CompletedAt,
            IsDiscarded = task.IsDiscarded,
            DiscardedAt = task.DiscardedAt,
            DiscardReason = task.DiscardReason,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            CommentCount = commentCount,
            CommentTypeCounts = commentTypeCounts ?? new Dictionary<TaskCommentType, int>(),
            PredecessorTaskId = task.PredecessorTaskId,
            PredecessorTask = predecessorInfo,
            SuccessorTaskCount = successorTaskCount,
            RowVersion = task.RowVersion,
        };
    }

    /// <summary>
    /// ログインユーザーに割り当てられたタスク一覧を取得（全ワークスペース横断）
    /// </summary>
    /// <param name="userId">ログインユーザーID</param>
    /// <param name="request">フィルタリング・ページネーションリクエスト</param>
    /// <returns>タスク一覧、コメント数辞書、総件数のタプル</returns>
    public async Task<(List<WorkspaceTask> Tasks, Dictionary<int, int> CommentCounts, int TotalCount)> GetMyTasksAsync(
        int userId,
        GetMyTasksRequest request
    )
    {
        var query = _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Workspace!)
                    .ThenInclude(w => w.Genre)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Owner)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Assignee)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Committer)
            .Where(t => t.AssignedUserId == userId);

        // ステータスフィルタ
        if (request.Status.HasValue)
        {
            query = request.Status.Value switch
            {
                TaskStatusFilter.Active => query.Where(t => !t.IsCompleted && !t.IsDiscarded),
                TaskStatusFilter.Completed => query.Where(t => t.IsCompleted && !t.IsDiscarded),
                TaskStatusFilter.Discarded => query.Where(t => t.IsDiscarded),
                _ => query, // All の場合はフィルタなし
            };
        }

        // 総件数を取得
        var totalCount = await query.CountAsync();

        // ページネーション（ページサイズは設定から取得）
        var pageSize = _config.Pagination.DefaultPageSize;
        var tasks = await query
            .AsSplitQuery() // デカルト爆発防止
            .OrderBy(t => t.DueDate) // 期限が近い順
            .ThenByDescending(t => t.CreatedAt)
            .Skip((request.Page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 各タスクのコメント数を取得
        var taskIds = tasks.Select(t => t.Id).ToList();
        var commentCounts = await _context.TaskComments
            .Where(c => taskIds.Contains(c.WorkspaceTaskId))
            .GroupBy(c => c.WorkspaceTaskId)
            .Select(g => new { TaskId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TaskId, x => x.Count);

        return (tasks, commentCounts, totalCount);
    }

    /// <summary>
    /// ログインユーザーのタスク統計情報を取得
    /// </summary>
    /// <param name="userId">ログインユーザーID</param>
    /// <returns>統計情報</returns>
    public async Task<WorkspaceTaskStatistics> GetMyTaskStatisticsAsync(int userId)
    {
        // DateTimeOffset で日付範囲を定義（PostgreSQL との互換性のため）
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var todayEnd = todayStart.AddDays(1);
        var sevenDaysLaterEnd = todayStart.AddDays(8); // 7日後の終わりまで

        var query = _context.WorkspaceTasks
            .Where(t => t.AssignedUserId == userId);

        // 各統計値を計算
        var totalCount = await query.CountAsync();
        var completedCount = await query.CountAsync(t => t.IsCompleted && !t.IsDiscarded);
        var incompleteCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded);
        var overdueCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart);
        var dueTodayCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate >= todayStart && t.DueDate < todayEnd);
        var dueSoonCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate >= todayEnd && t.DueDate < sevenDaysLaterEnd);
        var discardedCount = await query.CountAsync(t => t.IsDiscarded);

        // タスクに紐づくコメント総数
        var taskIds = await query.Select(t => t.Id).ToListAsync();
        var commentCount = taskIds.Count > 0
            ? await _context.TaskComments.CountAsync(c => taskIds.Contains(c.WorkspaceTaskId))
            : 0;

        return new WorkspaceTaskStatistics
        {
            TotalCount = totalCount,
            CompletedCount = completedCount,
            IncompleteCount = incompleteCount,
            OverdueCount = overdueCount,
            DueTodayCount = dueTodayCount,
            DueSoonCount = dueSoonCount,
            DiscardedCount = discardedCount,
            CommentCount = commentCount,
        };
    }

    /// <summary>
    /// WorkspaceTaskエンティティからMyTaskDetailResponseを生成
    /// </summary>
    /// <param name="task">タスクエンティティ（WorkspaceItem含む）</param>
    /// <param name="commentCount">コメント数</param>
    public static MyTaskDetailResponse BuildMyTaskDetailResponse(WorkspaceTask task, int commentCount = 0)
    {
        var item = task.WorkspaceItem;
        return new MyTaskDetailResponse
        {
            Id = task.Id,
            WorkspaceItemId = task.WorkspaceItemId,
            WorkspaceId = task.WorkspaceId,
            WorkspaceCode = item?.Workspace?.Code,
            WorkspaceName = item?.Workspace?.Name,
            GenreIcon = item?.Workspace?.Genre?.Icon,
            GenreName = item?.Workspace?.Genre?.Name,
            WorkspaceMode = item?.Workspace?.Mode,
            ItemCode = item?.Code,
            ItemSubject = item?.Subject,
            ItemOwner = UserIdentityResponseBuilder.FromUserWithId(item?.OwnerId ?? 0, item?.Owner),
            ItemAssignee = UserIdentityResponseBuilder.FromNullableUserWithId(item?.AssigneeId, item?.Assignee),
            ItemCommitter = UserIdentityResponseBuilder.FromNullableUserWithId(item?.CommitterId, item?.Committer),
            CreatedBy = UserIdentityResponseBuilder.FromUserWithId(task.CreatedByUserId, task.CreatedByUser),
            OrganizationId = task.OrganizationId,
            Content = task.Content,
            TaskTypeId = task.TaskTypeId,
            TaskTypeCode = task.TaskType?.Code,
            TaskTypeName = task.TaskType?.Name,
            TaskTypeIcon = task.TaskType?.Icon,
            Priority = task.Priority,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedHours = task.EstimatedHours,
            ActualHours = task.ActualHours,
            ProgressPercentage = task.ProgressPercentage,
            IsCompleted = task.IsCompleted,
            CompletedAt = task.CompletedAt,
            IsDiscarded = task.IsDiscarded,
            DiscardedAt = task.DiscardedAt,
            DiscardReason = task.DiscardReason,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            CommentCount = commentCount,
            RowVersion = task.RowVersion,
        };
    }

    /// <summary>
    /// ログインユーザーがコミッターになっているワークスペースの一覧を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>コミッターワークスペースのリスト</returns>
    public async Task<List<MyCommitterWorkspaceResponse>> GetMyCommitterWorkspacesAsync(int userId)
    {
        // DateTimeOffset で日付範囲を定義（PostgreSQL との互換性のため）
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);

        // ユーザーがコミッターになっているアイテムを持つワークスペースを取得
        var workspaces = await _context.WorkspaceItems
            .Include(wi => wi.Workspace!)
                .ThenInclude(w => w.Genre)
            .Where(wi => wi.CommitterId == userId)
            .Where(wi => !wi.IsArchived) // アーカイブされていないアイテムのみ
            .Where(wi => wi.Workspace!.IsActive) // アクティブなワークスペースのみ
            .GroupBy(wi => new
            {
                wi.WorkspaceId,
                WorkspaceCode = wi.Workspace!.Code,
                WorkspaceName = wi.Workspace!.Name,
                GenreIcon = wi.Workspace!.Genre != null ? wi.Workspace.Genre.Icon : null,
                GenreName = wi.Workspace!.Genre != null ? wi.Workspace.Genre.Name : null,
                Mode = wi.Workspace!.Mode,
            })
            .Select(g => new
            {
                g.Key.WorkspaceId,
                g.Key.WorkspaceCode,
                g.Key.WorkspaceName,
                g.Key.GenreIcon,
                g.Key.GenreName,
                g.Key.Mode,
                ItemCount = g.Count(),
                ItemIds = g.Select(wi => wi.Id).ToList(),
            })
            .ToListAsync();

        // ワークスペースが見つからない場合は空リストを返す
        if (workspaces.Count == 0)
        {
            return [];
        }

        // 全アイテムIDを収集
        var allItemIds = workspaces.SelectMany(w => w.ItemIds).ToList();

        // タスク統計を一括取得
        var taskStats = await _context.WorkspaceTasks
            .Where(t => allItemIds.Contains(t.WorkspaceItemId))
            .GroupBy(t => t.WorkspaceItem!.WorkspaceId)
            .Select(g => new
            {
                WorkspaceId = g.Key,
                ActiveTaskCount = g.Count(t => !t.IsCompleted && !t.IsDiscarded),
                CompletedTaskCount = g.Count(t => t.IsCompleted && !t.IsDiscarded),
                OverdueTaskCount = g.Count(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart),
                HelpCommentCount = g.Count(t => t.TaskComments.Any(c => c.CommentType == TaskCommentType.HelpWanted)),
                ReminderCommentCount = g.Count(t => t.TaskComments.Any(c => c.CommentType == TaskCommentType.Reminder)),
                OldestDueDate = g.Where(t => !t.IsCompleted && !t.IsDiscarded)
                                  .Min(t => (DateTimeOffset?)t.DueDate),
            })
            .ToDictionaryAsync(x => x.WorkspaceId);

        // レスポンスを構築
        var results = workspaces.Select(w =>
        {
            taskStats.TryGetValue(w.WorkspaceId, out var stats);
            return new MyCommitterWorkspaceResponse
            {
                WorkspaceId = w.WorkspaceId,
                WorkspaceCode = w.WorkspaceCode ?? string.Empty,
                WorkspaceName = w.WorkspaceName ?? string.Empty,
                GenreIcon = w.GenreIcon,
                GenreName = w.GenreName,
                Mode = w.Mode,
                ItemCount = w.ItemCount,
                ActiveTaskCount = stats?.ActiveTaskCount ?? 0,
                CompletedTaskCount = stats?.CompletedTaskCount ?? 0,
                OverdueTaskCount = stats?.OverdueTaskCount ?? 0,
                HelpCommentCount = stats?.HelpCommentCount ?? 0,
                ReminderCommentCount = stats?.ReminderCommentCount ?? 0,
                OldestDueDate = stats?.OldestDueDate,
            };
        })
        .OrderBy(w => w.OldestDueDate == null ? 1 : 0) // 期限日がNULLのものは後ろ
        .ThenBy(w => w.OldestDueDate) // 期限日が古い順
        .ThenBy(w => w.WorkspaceName)
        .Select((w, index) => w with { ListIndex = index })
        .ToList();

        return results;
    }

    /// <summary>
    /// ログインユーザーが担当のタスクを持つワークスペース一覧を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>タスクワークスペースのリスト</returns>
    public async Task<List<MyTaskWorkspaceResponse>> GetMyTaskWorkspacesAsync(int userId)
    {
        // DateTimeOffset で日付範囲を定義（PostgreSQL との互換性のため）
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);

        // ユーザーが担当のタスクを持つワークスペースを取得
        var workspaces = await _context.WorkspaceTasks
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Workspace!)
                    .ThenInclude(w => w.Genre)
            .Include(t => t.TaskComments)
            .Where(t => t.AssignedUserId == userId)
            .Where(t => !t.WorkspaceItem!.IsArchived) // アーカイブされていないアイテムのみ
            .Where(t => t.WorkspaceItem!.Workspace!.IsActive) // アクティブなワークスペースのみ
            .GroupBy(t => new
            {
                t.WorkspaceId,
                WorkspaceCode = t.WorkspaceItem!.Workspace!.Code,
                WorkspaceName = t.WorkspaceItem!.Workspace!.Name,
                GenreIcon = t.WorkspaceItem!.Workspace!.Genre != null ? t.WorkspaceItem.Workspace.Genre.Icon : null,
                GenreName = t.WorkspaceItem!.Workspace!.Genre != null ? t.WorkspaceItem.Workspace.Genre.Name : null,
                Mode = t.WorkspaceItem!.Workspace!.Mode,
            })
            .Select(g => new MyTaskWorkspaceResponse
            {
                WorkspaceId = g.Key.WorkspaceId,
                WorkspaceCode = g.Key.WorkspaceCode ?? string.Empty,
                WorkspaceName = g.Key.WorkspaceName ?? string.Empty,
                GenreIcon = g.Key.GenreIcon,
                GenreName = g.Key.GenreName,
                Mode = g.Key.Mode,
                ActiveTaskCount = g.Count(t => !t.IsCompleted && !t.IsDiscarded),
                CompletedTaskCount = g.Count(t => t.IsCompleted && !t.IsDiscarded),
                OverdueTaskCount = g.Count(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart),
                OldestDueDate = g.Where(t => !t.IsCompleted && !t.IsDiscarded)
                                 .Min(t => (DateTimeOffset?)t.DueDate),
                HelpCommentCount = g.Sum(t => t.TaskComments.Count(c => c.CommentType == TaskCommentType.HelpWanted)),
                ReminderCommentCount = g.Sum(t => t.TaskComments.Count(c => c.CommentType == TaskCommentType.Urge)),
            })
            .ToListAsync();

        // 期限日が古い順（NULLは最後）
        return workspaces
            .OrderBy(w => w.OldestDueDate == null ? 1 : 0)
            .ThenBy(w => w.OldestDueDate)
            .ThenBy(w => w.WorkspaceName)
            .Select((w, index) => w with { ListIndex = index })
            .ToList();
    }

    /// <summary>
    /// 指定ワークスペース内のマイタスクを期限日グループで取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="filter">ダッシュボード用フィルター（省略時はActive）</param>
    /// <returns>期限日でグループ化されたタスク一覧</returns>
    public async Task<List<TasksByDueDateResponse>> GetMyTasksByWorkspaceAsync(
        int userId,
        int workspaceId,
        DashboardTaskFilter? filter = null
    )
    {
        var effectiveFilter = filter ?? DashboardTaskFilter.Active;

        // HelpWanted/Reminderフィルタの場合、対象タスクIDを先に取得
        HashSet<int>? targetTaskIds = null;
        if (effectiveFilter == DashboardTaskFilter.HelpWanted)
        {
            targetTaskIds = await GetTaskIdsWithCommentTypeAsync(workspaceId, userId, null, TaskCommentType.HelpWanted);
        }
        else if (effectiveFilter == DashboardTaskFilter.Reminder)
        {
            targetTaskIds = await GetTaskIdsWithCommentTypeAsync(workspaceId, userId, null, TaskCommentType.Urge);
        }

        var query = _context.WorkspaceTasks
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Workspace)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Owner)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Assignee)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Committer)
            .Include(t => t.TaskType)
            .Include(t => t.AssignedUser)
            .Where(t => t.AssignedUserId == userId && t.WorkspaceId == workspaceId)
            .Where(t => !t.WorkspaceItem!.IsArchived)
            .AsQueryable();

        // フィルタ適用
        query = ApplyDashboardFilter(query, effectiveFilter, targetTaskIds);

        var tasks = await query
            .OrderBy(t => t.DueDate)                    // 期限日古い順
            .ThenBy(t => t.WorkspaceItemId)            // アイテムID順
            .ThenBy(t => t.Id)                         // タスクID順
            .AsSplitQuery()
            .ToListAsync();

        var commentTypeCountsByTask = await GetCommentTypeCountsByTaskIdsAsync(tasks.Select(t => t.Id));

        // 期限日でグループ化し、ListIndexを付与
        return tasks
            .GroupBy(t => DateOnly.FromDateTime(t.DueDate.Date))
            .Select((g, groupIndex) => new TasksByDueDateResponse
            {
                ListIndex = groupIndex,
                DueDate = g.Key,
                Tasks = g.Select((t, taskIndex) => BuildTaskWithItemResponse(t, commentTypeCountsByTask, taskIndex)).ToList(),
            })
            .ToList();
    }

    /// <summary>
    /// 指定ワークスペース内のコミッタータスクを期限日グループで取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="filter">ダッシュボード用フィルター（省略時はActive）</param>
    /// <returns>期限日でグループ化されたタスク一覧</returns>
    public async Task<List<TasksByDueDateResponse>> GetCommitterTasksByWorkspaceAsync(
        int userId,
        int workspaceId,
        DashboardTaskFilter? filter = null
    )
    {
        var effectiveFilter = filter ?? DashboardTaskFilter.Active;

        // HelpWanted/Reminderフィルタの場合、対象タスクIDを先に取得
        HashSet<int>? targetTaskIds = null;
        if (effectiveFilter == DashboardTaskFilter.HelpWanted)
        {
            targetTaskIds = await GetTaskIdsWithCommentTypeAsync(workspaceId, null, userId, TaskCommentType.HelpWanted);
        }
        else if (effectiveFilter == DashboardTaskFilter.Reminder)
        {
            targetTaskIds = await GetTaskIdsWithCommentTypeAsync(workspaceId, null, userId, TaskCommentType.Urge);
        }

        // ユーザーがコミッターのアイテムに紐づくタスクを取得
        var query = _context.WorkspaceTasks
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Workspace)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Owner)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Assignee)
            .Include(t => t.WorkspaceItem!)
                .ThenInclude(wi => wi.Committer)
            .Include(t => t.TaskType)
            .Include(t => t.AssignedUser)
            .Where(t => t.WorkspaceId == workspaceId)
            .Where(t => t.WorkspaceItem!.CommitterId == userId)
            .Where(t => !t.WorkspaceItem!.IsArchived)
            .AsQueryable();

        // フィルタ適用
        query = ApplyDashboardFilter(query, effectiveFilter, targetTaskIds);

        var tasks = await query
            .OrderBy(t => t.DueDate)
            .ThenBy(t => t.WorkspaceItemId)
            .ThenBy(t => t.Id)
            .AsSplitQuery()
            .ToListAsync();

        var commentTypeCountsByTask = await GetCommentTypeCountsByTaskIdsAsync(tasks.Select(t => t.Id));

        return tasks
            .GroupBy(t => DateOnly.FromDateTime(t.DueDate.Date))
            .Select((g, groupIndex) => new TasksByDueDateResponse
            {
                ListIndex = groupIndex,
                DueDate = g.Key,
                Tasks = g.Select((t, taskIndex) => BuildTaskWithItemResponse(t, commentTypeCountsByTask, taskIndex)).ToList(),
            })
            .ToList();
    }

    /// <summary>
    /// ダッシュボード用フィルタをクエリに適用
    /// </summary>
    private static IQueryable<WorkspaceTask> ApplyDashboardFilter(
        IQueryable<WorkspaceTask> query,
        DashboardTaskFilter filter,
        HashSet<int>? targetTaskIds = null)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        return filter switch
        {
            DashboardTaskFilter.Active => query.Where(t => !t.IsCompleted && !t.IsDiscarded),
            DashboardTaskFilter.Completed => query.Where(t => t.IsCompleted && !t.IsDiscarded),
            DashboardTaskFilter.Overdue => query.Where(t => !t.IsCompleted && !t.IsDiscarded && DateOnly.FromDateTime(t.DueDate.Date) < today),
            // HelpWanted/Reminder: 完了・破棄されていないタスクのみ対象
            DashboardTaskFilter.HelpWanted => targetTaskIds != null
                ? query.Where(t => !t.IsCompleted && !t.IsDiscarded && targetTaskIds.Contains(t.Id))
                : query.Where(t => false),
            DashboardTaskFilter.Reminder => targetTaskIds != null
                ? query.Where(t => !t.IsCompleted && !t.IsDiscarded && targetTaskIds.Contains(t.Id))
                : query.Where(t => false),
            _ => query.Where(t => !t.IsCompleted && !t.IsDiscarded),
        };
    }

    /// <summary>
    /// 特定のコメントタイプを持つタスクIDを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="assignedUserId">担当ユーザーID（マイタスク用、nullの場合は無視）</param>
    /// <param name="committerId">コミッターユーザーID（コミッター用、nullの場合は無視）</param>
    /// <param name="commentType">コメントタイプ</param>
    private async Task<HashSet<int>> GetTaskIdsWithCommentTypeAsync(
        int workspaceId,
        int? assignedUserId,
        int? committerId,
        TaskCommentType commentType)
    {
        var query = _context.TaskComments
            .Include(c => c.WorkspaceTask)
                .ThenInclude(t => t!.WorkspaceItem)
            .Where(c => c.WorkspaceTask!.WorkspaceId == workspaceId)
            .Where(c => c.CommentType == commentType)
            .Where(c => !c.WorkspaceTask!.WorkspaceItem!.IsArchived)
            .AsQueryable();

        if (assignedUserId.HasValue)
        {
            query = query.Where(c => c.WorkspaceTask!.AssignedUserId == assignedUserId.Value);
        }

        if (committerId.HasValue)
        {
            query = query.Where(c => c.WorkspaceTask!.WorkspaceItem!.CommitterId == committerId.Value);
        }

        var taskIds = await query
            .Select(c => c.WorkspaceTaskId)
            .Distinct()
            .ToListAsync();

        return taskIds.ToHashSet();
    }

    /// <summary>
    /// WorkspaceTaskエンティティからTaskWithItemResponseを生成
    /// </summary>
    /// <param name="task">タスクエンティティ（WorkspaceItem含む）</param>
    /// <param name="commentTypeCountsByTask">タスクIDをキーとしたコメントタイプ別件数</param>
    /// <param name="listIndex">リスト内でのインデックス（React key用）</param>
    private static TaskWithItemResponse BuildTaskWithItemResponse(
        WorkspaceTask task,
        Dictionary<int, Dictionary<TaskCommentType, int>>? commentTypeCountsByTask = null,
        int listIndex = 0
    )
    {
        var item = task.WorkspaceItem;
        var workspaceCode = item?.Workspace?.Code ?? "";
        var itemCode = item?.Code ?? "";

        var commentTypeCounts = commentTypeCountsByTask != null
            && commentTypeCountsByTask.TryGetValue(task.Id, out var typeCounts)
                ? typeCounts
                : new Dictionary<TaskCommentType, int>();

        return new TaskWithItemResponse
        {
            // React key用インデックス
            ListIndex = listIndex,

            // タスク情報
            TaskId = task.Id,
            Sequence = task.Sequence,
            TaskContent = task.Content,
            TaskTypeId = task.TaskTypeId,
            TaskTypeCode = task.TaskType?.Code,
            TaskTypeName = task.TaskType?.Name,
            TaskTypeIcon = task.TaskType?.Icon,
            Priority = task.Priority,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedHours = task.EstimatedHours,
            ActualHours = task.ActualHours,
            ProgressPercentage = task.ProgressPercentage,
            IsCompleted = task.IsCompleted,
            CompletedAt = task.CompletedAt,
            IsDiscarded = task.IsDiscarded,
            Assigned = UserIdentityResponseBuilder.FromUserWithId(task.AssignedUserId, task.AssignedUser),
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,

            // アイテム情報
            ItemId = item?.Id ?? 0,
            ItemCode = itemCode,
            ItemSubject = item?.Subject ?? "",
            WorkspaceCode = workspaceCode,
            ItemOwner = UserIdentityResponseBuilder.FromUserWithId(item?.OwnerId ?? 0, item?.Owner),
            ItemAssignee = UserIdentityResponseBuilder.FromNullableUserWithId(item?.AssigneeId, item?.Assignee),
            ItemCommitter = UserIdentityResponseBuilder.FromNullableUserWithId(item?.CommitterId, item?.Committer),
            CommentTypeCounts = commentTypeCounts,
        };
    }

    /// <summary>
    /// 指定されたタスクID群に対するコメントタイプ別件数を取得する
    /// </summary>
    /// <param name="taskIds">タスクIDの列挙</param>
    /// <returns>タスクIDをキー、コメントタイプ別件数辞書を値とするディクショナリ</returns>
    private async Task<Dictionary<int, Dictionary<TaskCommentType, int>>> GetCommentTypeCountsByTaskIdsAsync(
        IEnumerable<int> taskIds
    )
    {
        var idList = taskIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (idList.Count == 0)
        {
            return new Dictionary<int, Dictionary<TaskCommentType, int>>();
        }

        var grouped = await _context.TaskComments
            .Where(c => idList.Contains(c.WorkspaceTaskId))
            .GroupBy(c => new
            {
                c.WorkspaceTaskId,
                CommentType = c.CommentType ?? TaskCommentType.Normal,
            })
            .Select(g => new
            {
                g.Key.WorkspaceTaskId,
                g.Key.CommentType,
                Count = g.Count(),
            })
            .ToListAsync();

        var result = new Dictionary<int, Dictionary<TaskCommentType, int>>();

        foreach (var entry in grouped)
        {
            if (!result.TryGetValue(entry.WorkspaceTaskId, out var typeCounts))
            {
                typeCounts = new Dictionary<TaskCommentType, int>();
                result[entry.WorkspaceTaskId] = typeCounts;
            }

            typeCounts[entry.CommentType] = entry.Count;
        }

        return result;
    }

    /// <summary>
    /// コメントタイプ別件数の合計を計算する
    /// </summary>
    /// <param name="typeCounts">タイプ別件数ディクショナリ</param>
    /// <returns>コメント総数</returns>
    private static int SumCommentCounts(Dictionary<TaskCommentType, int>? typeCounts)
    {
        return typeCounts?.Values.Sum() ?? 0;
    }

    /// <summary>
    /// 先行タスクの設定により循環参照が発生するかチェック
    /// </summary>
    /// <param name="taskId">設定対象のタスクID</param>
    /// <param name="predecessorId">設定しようとしている先行タスクID</param>
    /// <returns>循環参照が発生する場合はtrue</returns>
    private async Task<bool> HasCircularDependencyAsync(int taskId, int predecessorId)
    {
        var currentId = (int?)predecessorId;
        var visited = new HashSet<int> { taskId };

        while (currentId.HasValue)
        {
            if (visited.Contains(currentId.Value))
            {
                return true; // 循環検出
            }

            visited.Add(currentId.Value);
            var task = await _context.WorkspaceTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == currentId.Value);
            currentId = task?.PredecessorTaskId;
        }

        return false;
    }

    /// <summary>
    /// アイテム内のタスクフローマップを取得
    /// 依存関係をチェーン形式で可視化するためのデータを返す
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <returns>タスクフローマップレスポンス</returns>
    public async Task<TaskFlowMapResponse> GetTaskFlowMapAsync(int workspaceId, int itemId)
    {
        // アイテム内の全タスクを取得
        var tasks = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .Where(t => t.WorkspaceId == workspaceId && t.WorkspaceItemId == itemId)
            .OrderBy(t => t.DueDate)
            .ThenBy(t => t.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        if (tasks.Count == 0)
        {
            return new TaskFlowMapResponse
            {
                CriticalPath = new List<TaskFlowNode>(),
                OtherChains = new List<List<TaskFlowNode>>(),
                IndependentTasks = new List<TaskFlowNode>(),
                Summary = new TaskFlowSummary
                {
                    TotalCount = 0,
                    ReadyCount = 0,
                    WaitingCount = 0,
                    InProgressCount = 0,
                    CompletedCount = 0,
                    DiscardedCount = 0,
                },
            };
        }

        // タスクIDからタスクへのマップを作成
        var taskMap = tasks.ToDictionary(t => t.Id);

        // 後続タスク数を計算
        var successorCounts = tasks
            .Where(t => t.PredecessorTaskId.HasValue)
            .GroupBy(t => t.PredecessorTaskId!.Value)
            .ToDictionary(g => g.Key, g => g.Count());

        // 依存チェーンを構築（WorkspaceTask のリストとして）
        var taskChains = BuildDependencyChains(tasks, taskMap);

        // 各チェーンの期間を計算し、最長期間のチェーンをクリティカルパスとして特定
        var chainsWithDuration = taskChains
            .Select(chain => new { Chain = chain, Duration = CalculateChainDuration(chain) })
            .OrderByDescending(x => x.Duration)
            .ThenByDescending(x => x.Chain.Count) // 同じ期間ならタスク数で判定
            .ToList();

        var criticalPathTasks = chainsWithDuration.FirstOrDefault()?.Chain ?? new List<WorkspaceTask>();
        var otherChainTasks = chainsWithDuration.Skip(1).Select(x => x.Chain).ToList();

        // WorkspaceTask → TaskFlowNode に変換（期間計算付き）
        var criticalPath = ConvertChainToNodes(criticalPathTasks, taskMap, successorCounts);
        var otherChains = otherChainTasks
            .Select(chain => ConvertChainToNodes(chain, taskMap, successorCounts))
            .ToList();

        // 独立タスク（どのチェーンにも含まれないタスク）を特定
        var chainTaskIds = taskChains.SelectMany(c => c.Select(t => t.Id)).ToHashSet();
        var independentTasks = tasks
            .Where(t => !chainTaskIds.Contains(t.Id))
            .Select(t => BuildTaskFlowNodeWithDuration(t, taskMap, successorCounts, null))
            .ToList();

        // サマリを計算
        var summary = CalculateTaskFlowSummary(tasks, taskMap);

        return new TaskFlowMapResponse
        {
            CriticalPath = criticalPath,
            OtherChains = otherChains,
            IndependentTasks = independentTasks,
            Summary = summary,
        };
    }

    /// <summary>
    /// チェーンの合計所要期間（日数）を計算
    /// - StartDate があれば使用
    /// - なければ前タスクの DueDate を使用
    /// - 最初のタスクで StartDate がなければ CreatedAt を使用
    /// </summary>
    private static decimal CalculateChainDuration(List<WorkspaceTask> chain)
    {
        if (chain.Count == 0) return 0;

        decimal totalDays = 0;
        DateTimeOffset? previousDueDate = null;

        foreach (var task in chain)
        {
            // 完了・破棄済みは期間に含めない（ただし previousDueDate は更新）
            if (task.IsCompleted || task.IsDiscarded)
            {
                previousDueDate = task.DueDate;
                continue;
            }

            // 開始日の決定
            var startDate = task.StartDate          // 設定された StartDate
                ?? previousDueDate                   // 前タスクの DueDate
                ?? task.CreatedAt;                   // 最初のタスクなら CreatedAt

            double duration;
            if (task.EstimatedHours.HasValue && task.EstimatedHours.Value > 0)
            {
                // 推定工数がある場合、8時間労働日で換算
                duration = (double)task.EstimatedHours.Value / 8.0;
            }
            else
            {
                // 推定工数がない場合、営業日（土日除外）で計算
                duration = CalculateBusinessDays(startDate, task.DueDate);
            }

            totalDays += (decimal)Math.Max(0, duration);

            previousDueDate = task.DueDate;
        }

        return totalDays;
    }

    /// <summary>
    /// 2つの日付間の営業日数を計算（土日を除外）
    /// </summary>
    /// <param name="startDate">開始日</param>
    /// <param name="endDate">終了日</param>
    /// <returns>営業日数</returns>
    private static double CalculateBusinessDays(DateTimeOffset startDate, DateTimeOffset endDate)
    {
        if (endDate <= startDate)
        {
            return 0;
        }

        var start = startDate.Date;
        var end = endDate.Date;

        var totalDays = (int)(end - start).TotalDays;
        var fullWeeks = totalDays / 7;
        var remainingDays = totalDays % 7;

        // 完全な週の営業日（週5日）
        var businessDays = fullWeeks * 5;

        // 残りの日数をチェック
        var currentDay = start.AddDays(fullWeeks * 7);
        for (var i = 0; i < remainingDays; i++)
        {
            if (currentDay.DayOfWeek != DayOfWeek.Saturday && currentDay.DayOfWeek != DayOfWeek.Sunday)
            {
                businessDays++;
            }
            currentDay = currentDay.AddDays(1);
        }

        return businessDays;
    }

    /// <summary>
    /// 依存チェーンを構築
    /// 分岐がある場合は、各末端までの完全なパスを別々のチェーンとして返す
    /// </summary>
    private static List<List<WorkspaceTask>> BuildDependencyChains(
        List<WorkspaceTask> tasks,
        Dictionary<int, WorkspaceTask> taskMap
    )
    {
        // 後続タスクのマップを構築（親タスクID → 子タスクのリスト）
        var successorMap = tasks
            .Where(t => t.PredecessorTaskId.HasValue)
            .GroupBy(t => t.PredecessorTaskId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var allPaths = new List<List<WorkspaceTask>>();

        // 先行タスクを持たないタスク（チェーンの起点）を特定
        var rootTasks = tasks.Where(t => !t.PredecessorTaskId.HasValue).ToList();

        // 後続タスクを持つルートタスクからすべてのパスを探索
        foreach (var rootTask in rootTasks.Where(t => successorMap.ContainsKey(t.Id)))
        {
            var paths = FindAllPathsFromRoot(rootTask, successorMap);
            allPaths.AddRange(paths);
        }

        // 先行タスクを持つが、その先行タスクがこのアイテム内にないタスク（孤立した起点）
        var orphanRoots = tasks
            .Where(t => t.PredecessorTaskId.HasValue && !taskMap.ContainsKey(t.PredecessorTaskId.Value))
            .ToList();

        foreach (var orphanRoot in orphanRoots)
        {
            var paths = FindAllPathsFromRoot(orphanRoot, successorMap);
            allPaths.AddRange(paths);
        }

        return allPaths;
    }

    /// <summary>
    /// ルートタスクからすべての末端までのパスを探索（DFS）
    /// </summary>
    private static List<List<WorkspaceTask>> FindAllPathsFromRoot(
        WorkspaceTask rootTask,
        Dictionary<int, List<WorkspaceTask>> successorMap
    )
    {
        var allPaths = new List<List<WorkspaceTask>>();
        var currentPath = new List<WorkspaceTask>();

        void Dfs(WorkspaceTask task)
        {
            currentPath.Add(task);

            // 後続タスクがあるか確認
            if (successorMap.TryGetValue(task.Id, out var successors) && successors.Count > 0)
            {
                // 各後続タスクについて再帰的に探索
                foreach (var successor in successors)
                {
                    Dfs(successor);
                }
            }
            else
            {
                // 末端に到達したら、現在のパスを保存
                allPaths.Add(new List<WorkspaceTask>(currentPath));
            }

            // バックトラック
            currentPath.RemoveAt(currentPath.Count - 1);
        }

        Dfs(rootTask);
        return allPaths;
    }

    /// <summary>
    /// TaskFlowNodeを構築
    /// </summary>
    private static TaskFlowNode BuildTaskFlowNode(
        WorkspaceTask task,
        Dictionary<int, WorkspaceTask> taskMap,
        Dictionary<int, int> successorCounts
    )
    {
        // 先行タスク情報を取得
        TaskFlowPredecessorInfo? predecessorInfo = null;
        if (task.PredecessorTaskId.HasValue && taskMap.TryGetValue(task.PredecessorTaskId.Value, out var predecessorTask))
        {
            predecessorInfo = new TaskFlowPredecessorInfo
            {
                Id = predecessorTask.Id,
                Sequence = predecessorTask.Sequence,
                Content = predecessorTask.Content,
                IsCompleted = predecessorTask.IsCompleted,
            };
        }

        // 着手可能かどうかを判定
        var canStart = !task.IsCompleted && !task.IsDiscarded &&
            (!task.PredecessorTaskId.HasValue ||
             (taskMap.TryGetValue(task.PredecessorTaskId.Value, out var pred) && pred.IsCompleted));

        return new TaskFlowNode
        {
            Id = task.Id,
            Sequence = task.Sequence,
            Content = task.Content,
            TaskTypeId = task.TaskTypeId,
            TaskTypeName = task.TaskType?.Name,
            TaskTypeIcon = task.TaskType?.Icon,
            Priority = task.Priority,
            DueDate = task.DueDate,
            ProgressPercentage = task.ProgressPercentage,
            IsCompleted = task.IsCompleted,
            IsDiscarded = task.IsDiscarded,
            Assigned = UserIdentityResponseBuilder.FromUserWithId(task.AssignedUserId, task.AssignedUser),
            CompletedBy = UserIdentityResponseBuilder.FromNullableUserWithId(task.CompletedByUserId, task.CompletedByUser),
            CanStart = canStart,
            PredecessorTaskId = task.PredecessorTaskId,
            PredecessorTask = predecessorInfo,
            SuccessorCount = successorCounts.GetValueOrDefault(task.Id, 0),
            DurationDays = null, // 期間なしバージョン
        };
    }

    /// <summary>
    /// チェーンをTaskFlowNodeのリストに変換（期間計算付き）
    /// </summary>
    private static List<TaskFlowNode> ConvertChainToNodes(
        List<WorkspaceTask> chain,
        Dictionary<int, WorkspaceTask> taskMap,
        Dictionary<int, int> successorCounts
    )
    {
        var result = new List<TaskFlowNode>();
        DateTimeOffset? previousDueDate = null;

        foreach (var task in chain)
        {
            var node = BuildTaskFlowNodeWithDuration(task, taskMap, successorCounts, previousDueDate);
            result.Add(node);
            previousDueDate = task.DueDate;
        }

        return result;
    }

    /// <summary>
    /// TaskFlowNodeを構築（期間計算付き）
    /// </summary>
    private static TaskFlowNode BuildTaskFlowNodeWithDuration(
        WorkspaceTask task,
        Dictionary<int, WorkspaceTask> taskMap,
        Dictionary<int, int> successorCounts,
        DateTimeOffset? previousDueDate
    )
    {
        // 先行タスク情報を取得
        TaskFlowPredecessorInfo? predecessorInfo = null;
        if (task.PredecessorTaskId.HasValue && taskMap.TryGetValue(task.PredecessorTaskId.Value, out var predecessorTask))
        {
            predecessorInfo = new TaskFlowPredecessorInfo
            {
                Id = predecessorTask.Id,
                Sequence = predecessorTask.Sequence,
                Content = predecessorTask.Content,
                IsCompleted = predecessorTask.IsCompleted,
            };
        }

        // 着手可能かどうかを判定
        var canStart = !task.IsCompleted && !task.IsDiscarded &&
            (!task.PredecessorTaskId.HasValue ||
             (taskMap.TryGetValue(task.PredecessorTaskId.Value, out var pred) && pred.IsCompleted));

        // 期間を計算（完了・破棄済みはnull）
        decimal? durationDays = null;
        var hasDueDateConflict = false;
        if (!task.IsCompleted && !task.IsDiscarded)
        {
            var startDate = task.StartDate ?? previousDueDate ?? task.CreatedAt;

            double duration;
            if (task.EstimatedHours.HasValue && task.EstimatedHours.Value > 0)
            {
                // 推定工数がある場合、8時間労働日で換算
                duration = (double)task.EstimatedHours.Value / 8.0;
            }
            else
            {
                // 推定工数がない場合、営業日（土日除外）で計算
                duration = CalculateBusinessDays(startDate, task.DueDate);
            }
            durationDays = (decimal)Math.Max(0, duration);

            // 先行タスクの期限日が自タスクの期限日より後の場合はコンフリクト
            if (previousDueDate.HasValue && previousDueDate.Value > task.DueDate)
            {
                hasDueDateConflict = true;
            }
        }

        return new TaskFlowNode
        {
            Id = task.Id,
            Sequence = task.Sequence,
            Content = task.Content,
            TaskTypeId = task.TaskTypeId,
            TaskTypeName = task.TaskType?.Name,
            TaskTypeIcon = task.TaskType?.Icon,
            Priority = task.Priority,
            DueDate = task.DueDate,
            ProgressPercentage = task.ProgressPercentage,
            IsCompleted = task.IsCompleted,
            IsDiscarded = task.IsDiscarded,
            Assigned = UserIdentityResponseBuilder.FromUserWithId(task.AssignedUserId, task.AssignedUser),
            CompletedBy = UserIdentityResponseBuilder.FromNullableUserWithId(task.CompletedByUserId, task.CompletedByUser),
            CanStart = canStart,
            PredecessorTaskId = task.PredecessorTaskId,
            PredecessorTask = predecessorInfo,
            SuccessorCount = successorCounts.GetValueOrDefault(task.Id, 0),
            DurationDays = durationDays,
            HasDueDateConflict = hasDueDateConflict,
        };
    }

    /// <summary>
    /// タスクフローサマリを計算
    /// </summary>
    private static TaskFlowSummary CalculateTaskFlowSummary(
        List<WorkspaceTask> tasks,
        Dictionary<int, WorkspaceTask> taskMap
    )
    {
        var totalCount = tasks.Count;
        var completedCount = tasks.Count(t => t.IsCompleted);
        var discardedCount = tasks.Count(t => t.IsDiscarded);

        // アクティブタスク（未完了・未破棄）
        var activeTasks = tasks.Where(t => !t.IsCompleted && !t.IsDiscarded).ToList();

        // 着手可能タスク（先行タスクなし or 先行タスク完了済み）
        var readyCount = activeTasks.Count(t =>
            !t.PredecessorTaskId.HasValue ||
            (taskMap.TryGetValue(t.PredecessorTaskId.Value, out var pred) && pred.IsCompleted));

        // 待機中タスク（先行タスク未完了）
        var waitingCount = activeTasks.Count(t =>
            t.PredecessorTaskId.HasValue &&
            taskMap.TryGetValue(t.PredecessorTaskId.Value, out var pred) && !pred.IsCompleted);

        // 進行中タスク（進捗 > 0 かつ未完了・着手可能）
        var inProgressCount = activeTasks.Count(t =>
            t.ProgressPercentage > 0 &&
            (!t.PredecessorTaskId.HasValue ||
             (taskMap.TryGetValue(t.PredecessorTaskId.Value, out var pred) && pred.IsCompleted)));

        return new TaskFlowSummary
        {
            TotalCount = totalCount,
            ReadyCount = readyCount,
            WaitingCount = waitingCount,
            InProgressCount = inProgressCount,
            CompletedCount = completedCount,
            DiscardedCount = discardedCount,
        };
    }

    /// <summary>
    /// タスク作成通知の送信先ユーザー一覧を取得
    /// （タスク担当者、アイテム担当者、アイテムコミッタ、アイテムオーナー）
    /// </summary>
    /// <param name="taskId">タスクID</param>
    /// <param name="excludeUserId">除外するユーザーID（タスク作成者）</param>
    /// <returns>通知先ユーザー一覧（重複なし、メールアドレスを持つ有効なユーザーのみ）</returns>
    public async Task<List<User>> GetTaskCreationNotificationTargetsAsync(int taskId, int excludeUserId)
    {
        var task = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi.Owner)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi.Assignee)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi.Committer)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            return new List<User>();
        }

        var targetUsers = new HashSet<User>();

        // タスク担当者
        if (task.AssignedUser != null &&
            task.AssignedUser.IsActive &&
            !string.IsNullOrEmpty(task.AssignedUser.Email) &&
            task.AssignedUserId != excludeUserId)
        {
            targetUsers.Add(task.AssignedUser);
        }

        // アイテムオーナー
        if (task.WorkspaceItem?.Owner != null &&
            task.WorkspaceItem.Owner.IsActive &&
            !string.IsNullOrEmpty(task.WorkspaceItem.Owner.Email) &&
            task.WorkspaceItem.OwnerId != excludeUserId)
        {
            targetUsers.Add(task.WorkspaceItem.Owner);
        }

        // アイテム担当者（設定されている場合）
        if (task.WorkspaceItem?.Assignee != null &&
            task.WorkspaceItem.Assignee.IsActive &&
            !string.IsNullOrEmpty(task.WorkspaceItem.Assignee.Email) &&
            task.WorkspaceItem.AssigneeId != excludeUserId)
        {
            targetUsers.Add(task.WorkspaceItem.Assignee);
        }

        // アイテムコミッタ（設定されている場合）
        if (task.WorkspaceItem?.Committer != null &&
            task.WorkspaceItem.Committer.IsActive &&
            !string.IsNullOrEmpty(task.WorkspaceItem.Committer.Email) &&
            task.WorkspaceItem.CommitterId != excludeUserId)
        {
            targetUsers.Add(task.WorkspaceItem.Committer);
        }

        return targetUsers.ToList();
    }

    /// <summary>
    /// メール送信用にタスク情報を詳細取得（ワークスペース、アイテム情報を含む）
    /// </summary>
    /// <param name="taskId">タスクID</param>
    /// <returns>タスク情報（存在しない場合はnull）</returns>
    public async Task<WorkspaceTask?> GetTaskWithDetailsForEmailAsync(int taskId)
    {
        return await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.Workspace)
            .Include(t => t.WorkspaceItem)
            .FirstOrDefaultAsync(t => t.Id == taskId);
    }

    /// <summary>
    /// タスク完了/破棄通知の送信先ユーザー一覧を取得
    /// （アイテム担当者、アイテムコミッタ、アイテムオーナー）
    /// </summary>
    /// <param name="taskId">タスクID</param>
    /// <param name="excludeUserId">除外するユーザーID（タスク完了/破棄を実行したユーザー）</param>
    /// <returns>通知先ユーザー一覧（重複なし、メールアドレスを持つ有効なユーザーのみ）</returns>
    public async Task<List<User>> GetTaskCompletionNotificationTargetsAsync(int taskId, int excludeUserId)
    {
        var task = await _context.WorkspaceTasks
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi.Owner)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi.Assignee)
            .Include(t => t.WorkspaceItem)
                .ThenInclude(wi => wi.Committer)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            return new List<User>();
        }

        var targetUsers = new HashSet<User>();

        // アイテムオーナー
        if (task.WorkspaceItem?.Owner != null &&
            task.WorkspaceItem.Owner.IsActive &&
            !string.IsNullOrEmpty(task.WorkspaceItem.Owner.Email) &&
            task.WorkspaceItem.OwnerId != excludeUserId)
        {
            targetUsers.Add(task.WorkspaceItem.Owner);
        }

        // アイテム担当者（設定されている場合）
        if (task.WorkspaceItem?.Assignee != null &&
            task.WorkspaceItem.Assignee.IsActive &&
            !string.IsNullOrEmpty(task.WorkspaceItem.Assignee.Email) &&
            task.WorkspaceItem.AssigneeId != excludeUserId)
        {
            targetUsers.Add(task.WorkspaceItem.Assignee);
        }

        // アイテムコミッタ（設定されている場合）
        if (task.WorkspaceItem?.Committer != null &&
            task.WorkspaceItem.Committer.IsActive &&
            !string.IsNullOrEmpty(task.WorkspaceItem.Committer.Email) &&
            task.WorkspaceItem.CommitterId != excludeUserId)
        {
            targetUsers.Add(task.WorkspaceItem.Committer);
        }

        return targetUsers.ToList();
    }
}