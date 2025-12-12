using Hangfire;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Models.Config;
using Pecus.Models.Requests.WorkspaceTask;
using System.Collections.Generic;
using System.Linq;

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

    public WorkspaceTaskService(
        ApplicationDbContext context,
        ILogger<WorkspaceTaskService> logger,
        OrganizationAccessHelper accessHelper,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient
    )
    {
        _context = context;
        _logger = logger;
        _accessHelper = accessHelper;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
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

        var task = new WorkspaceTask
        {
            WorkspaceItemId = itemId,
            WorkspaceId = workspaceId,
            OrganizationId = organizationId,
            AssignedUserId = request.AssignedUserId,
            CreatedByUserId = createdByUserId,
            Content = request.Content,
            TaskTypeId = request.TaskTypeId,
            Priority = request.Priority,
            StartDate = request.StartDate,
            DueDate = request.DueDate,
            EstimatedHours = request.EstimatedHours,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _context.WorkspaceTasks.Add(task);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "ワークスペースタスクを作成しました。TaskId={TaskId}, WorkspaceItemId={WorkspaceItemId}, CreatedByUserId={CreatedByUserId}",
            task.Id,
            itemId,
            createdByUserId
        );

        // ナビゲーションプロパティを読み込み
        await _context.Entry(task)
            .Reference(t => t.AssignedUser)
            .LoadAsync();
        await _context.Entry(task)
            .Reference(t => t.CreatedByUser)
            .LoadAsync();
        await _context.Entry(task)
            .Reference(t => t.TaskType)
            .LoadAsync();

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

        var commentTypeCountsByTask = await GetCommentTypeCountsByTaskIdsAsync(new[] { taskId });
        var commentTypeCounts = commentTypeCountsByTask.GetValueOrDefault(taskId, new Dictionary<TaskCommentType, int>());
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
            .Include(t => t.TaskType)
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

        // ページネーション
        var pageSize = request.PageSize;
        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
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
    /// <returns>更新されたタスクとコメント情報のタプル</returns>
    public async Task<(
        WorkspaceTask Task,
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

        // アクティビティ記録用のスナップショット
        var snapshot = new
        {
            IsCompleted = task.IsCompleted,
            IsDiscarded = task.IsDiscarded,
            Content = task.Content,
            AssigneeName = task.AssignedUser?.Username
        };

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
            }
            else if (!request.IsCompleted.Value)
            {
                task.CompletedAt = null;
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

        task.UpdatedAt = DateTime.UtcNow;

        // 楽観的ロック用のRowVersionを設定
        task.RowVersion = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            var latestTask = await _context.WorkspaceTasks
                .Include(t => t.AssignedUser)
                .Include(t => t.CreatedByUser)
                .Include(t => t.TaskType)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            var latestCommentTypeCounts = await GetCommentTypeCountsByTaskIdsAsync(new[] { taskId });
            var latestTypeCounts = latestCommentTypeCounts.GetValueOrDefault(taskId, new Dictionary<TaskCommentType, int>());
            var latestCommentCount = SumCommentCounts(latestTypeCounts);

            throw new ConcurrencyException<WorkspaceTaskDetailResponse>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestTask != null
                    ? BuildTaskDetailResponse(latestTask, latestCommentCount, latestTypeCounts)
                    : null
            );
        }

        _logger.LogInformation(
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

        return (task, commentCount, commentTypeCounts);
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
            Code = item.Code,
            Subject = item.Subject,
            Body = item.Body,
            OwnerId = item.OwnerId,
            OwnerUsername = item.Owner?.Username,
            OwnerAvatarUrl = item.Owner != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: item.Owner.AvatarType,
                    userId: item.Owner.Id,
                    username: item.Owner.Username,
                    email: item.Owner.Email,
                    avatarPath: item.Owner.UserAvatarPath
                )
                : null,
            AssigneeId = item.AssigneeId,
            AssigneeUsername = item.Assignee?.Username,
            AssigneeAvatarUrl = item.Assignee != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: item.Assignee.AvatarType,
                    userId: item.Assignee.Id,
                    username: item.Assignee.Username,
                    email: item.Assignee.Email,
                    avatarPath: item.Assignee.UserAvatarPath
                )
                : null,
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
    /// <param name="commentCount">コメント数</param>
    /// <param name="commentTypeCounts">コメントタイプ別件数</param>
    private static WorkspaceTaskDetailResponse BuildTaskDetailResponse(
        WorkspaceTask task,
        int commentCount = 0,
        Dictionary<TaskCommentType, int>? commentTypeCounts = null
    )
    {
        return new WorkspaceTaskDetailResponse
        {
            Id = task.Id,
            WorkspaceItemId = task.WorkspaceItemId,
            WorkspaceId = task.WorkspaceId,
            OrganizationId = task.OrganizationId,
            AssignedUserId = task.AssignedUserId,
            AssignedUsername = task.AssignedUser?.Username,
            AssignedAvatarUrl = task.AssignedUser != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: task.AssignedUser.AvatarType,
                    userId: task.AssignedUser.Id,
                    username: task.AssignedUser.Username,
                    email: task.AssignedUser.Email,
                    avatarPath: task.AssignedUser.UserAvatarPath
                )
                : null,
            CreatedByUserId = task.CreatedByUserId,
            CreatedByUsername = task.CreatedByUser?.Username,
            CreatedByAvatarUrl = task.CreatedByUser != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: task.CreatedByUser.AvatarType,
                    userId: task.CreatedByUser.Id,
                    username: task.CreatedByUser.Username,
                    email: task.CreatedByUser.Email,
                    avatarPath: task.CreatedByUser.UserAvatarPath
                )
                : null,
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
            ItemCode = item?.Code,
            ItemSubject = item?.Subject,
            ItemOwnerId = item?.OwnerId,
            ItemOwnerUsername = item?.Owner?.Username,
            ItemOwnerAvatarUrl = item?.Owner != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: item.Owner.AvatarType,
                    userId: item.Owner.Id,
                    username: item.Owner.Username,
                    email: item.Owner.Email,
                    avatarPath: item.Owner.UserAvatarPath
                )
                : null,
            ItemAssigneeId = item?.AssigneeId,
            ItemAssigneeUsername = item?.Assignee?.Username,
            ItemAssigneeAvatarUrl = item?.Assignee != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: item.Assignee.AvatarType,
                    userId: item.Assignee.Id,
                    username: item.Assignee.Username,
                    email: item.Assignee.Email,
                    avatarPath: item.Assignee.UserAvatarPath
                )
                : null,
            ItemCommitterId = item?.CommitterId,
            ItemCommitterUsername = item?.Committer?.Username,
            ItemCommitterAvatarUrl = item?.Committer != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: item.Committer.AvatarType,
                    userId: item.Committer.Id,
                    username: item.Committer.Username,
                    email: item.Committer.Email,
                    avatarPath: item.Committer.UserAvatarPath
                )
                : null,
            OrganizationId = task.OrganizationId,
            AssignedUserId = task.AssignedUserId,
            AssignedUsername = task.AssignedUser?.Username,
            AssignedAvatarUrl = task.AssignedUser != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: task.AssignedUser.AvatarType,
                    userId: task.AssignedUser.Id,
                    username: task.AssignedUser.Username,
                    email: task.AssignedUser.Email,
                    avatarPath: task.AssignedUser.UserAvatarPath
                )
                : null,
            CreatedByUserId = task.CreatedByUserId,
            CreatedByUsername = task.CreatedByUser?.Username,
            CreatedByAvatarUrl = task.CreatedByUser != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: task.CreatedByUser.AvatarType,
                    userId: task.CreatedByUser.Id,
                    username: task.CreatedByUser.Username,
                    email: task.CreatedByUser.Email,
                    avatarPath: task.CreatedByUser.UserAvatarPath
                )
                : null,
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
            .GroupBy(wi => new
            {
                wi.WorkspaceId,
                WorkspaceCode = wi.Workspace!.Code,
                WorkspaceName = wi.Workspace!.Name,
                GenreIcon = wi.Workspace!.Genre != null ? wi.Workspace.Genre.Icon : null,
                GenreName = wi.Workspace!.Genre != null ? wi.Workspace.Genre.Name : null,
            })
            .Select(g => new
            {
                g.Key.WorkspaceId,
                g.Key.WorkspaceCode,
                g.Key.WorkspaceName,
                g.Key.GenreIcon,
                g.Key.GenreName,
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
            .Where(t => t.AssignedUserId == userId)
            .Where(t => !t.WorkspaceItem!.IsArchived) // アーカイブされていないアイテムのみ
            .GroupBy(t => new
            {
                t.WorkspaceId,
                WorkspaceCode = t.WorkspaceItem!.Workspace!.Code,
                WorkspaceName = t.WorkspaceItem!.Workspace!.Name,
                GenreIcon = t.WorkspaceItem!.Workspace!.Genre != null ? t.WorkspaceItem.Workspace.Genre.Icon : null,
                GenreName = t.WorkspaceItem!.Workspace!.Genre != null ? t.WorkspaceItem.Workspace.Genre.Name : null,
                HelpCommentCount = t.TaskComments.Count(c => c.CommentType == TaskCommentType.HelpWanted),
                ReminderCommentCount = t.TaskComments.Count(c => c.CommentType == TaskCommentType.Reminder),
            })
            .Select(g => new MyTaskWorkspaceResponse
            {
                WorkspaceId = g.Key.WorkspaceId,
                WorkspaceCode = g.Key.WorkspaceCode ?? string.Empty,
                WorkspaceName = g.Key.WorkspaceName ?? string.Empty,
                GenreIcon = g.Key.GenreIcon,
                GenreName = g.Key.GenreName,
                ActiveTaskCount = g.Count(t => !t.IsCompleted && !t.IsDiscarded),
                CompletedTaskCount = g.Count(t => t.IsCompleted && !t.IsDiscarded),
                OverdueTaskCount = g.Count(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart),
                OldestDueDate = g.Where(t => !t.IsCompleted && !t.IsDiscarded)
                                 .Min(t => (DateTimeOffset?)t.DueDate),
                HelpCommentCount = g.Key.HelpCommentCount,
                ReminderCommentCount = g.Key.ReminderCommentCount,
            })
            .ToListAsync();

        // 期限日が古い順（NULLは最後）
        return workspaces
            .OrderBy(w => w.OldestDueDate == null ? 1 : 0)
            .ThenBy(w => w.OldestDueDate)
            .ThenBy(w => w.WorkspaceName)
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

        // 期限日でグループ化
        return tasks
            .GroupBy(t => DateOnly.FromDateTime(t.DueDate.Date))
            .Select(g => new TasksByDueDateResponse
            {
                DueDate = g.Key,
                Tasks = g.Select(t => BuildTaskWithItemResponse(t, commentTypeCountsByTask)).ToList(),
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
            .Select(g => new TasksByDueDateResponse
            {
                DueDate = g.Key,
                Tasks = g.Select(t => BuildTaskWithItemResponse(t, commentTypeCountsByTask)).ToList(),
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
            DashboardTaskFilter.HelpWanted => targetTaskIds != null
                ? query.Where(t => targetTaskIds.Contains(t.Id))
                : query.Where(t => false),
            DashboardTaskFilter.Reminder => targetTaskIds != null
                ? query.Where(t => targetTaskIds.Contains(t.Id))
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
    private static TaskWithItemResponse BuildTaskWithItemResponse(
        WorkspaceTask task,
        Dictionary<int, Dictionary<TaskCommentType, int>>? commentTypeCountsByTask = null
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
            // タスク情報
            TaskId = task.Id,
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
            AssignedUserId = task.AssignedUserId,
            AssignedUsername = task.AssignedUser?.Username,
            AssignedAvatarUrl = task.AssignedUser != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: task.AssignedUser.AvatarType,
                    userId: task.AssignedUser.Id,
                    username: task.AssignedUser.Username,
                    email: task.AssignedUser.Email,
                    avatarPath: task.AssignedUser.UserAvatarPath
                )
                : null,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,

            // アイテム情報
            ItemId = item?.Id ?? 0,
            ItemCode = itemCode,
            ItemSubject = item?.Subject ?? "",
            WorkspaceCode = workspaceCode,
            ItemOwnerId = item?.OwnerId ?? 0,
            ItemOwnerUsername = item?.Owner?.Username,
            ItemOwnerAvatarUrl = item?.Owner != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: item.Owner.AvatarType,
                    userId: item.Owner.Id,
                    username: item.Owner.Username,
                    email: item.Owner.Email,
                    avatarPath: item.Owner.UserAvatarPath
                )
                : null,
            ItemCommitterId = item?.CommitterId,
            ItemCommitterUsername = item?.Committer?.Username,
            ItemCommitterAvatarUrl = item?.Committer != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: item.Committer.AvatarType,
                    userId: item.Committer.Id,
                    username: item.Committer.Username,
                    email: item.Committer.Email,
                    avatarPath: item.Committer.UserAvatarPath
                )
                : null,
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
}