using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;

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

    public WorkspaceTaskService(
        ApplicationDbContext context,
        ILogger<WorkspaceTaskService> logger,
        OrganizationAccessHelper accessHelper,
        PecusConfig config
    )
    {
        _context = context;
        _logger = logger;
        _accessHelper = accessHelper;
        _config = config;
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

        return task;
    }

    /// <summary>
    /// ワークスペースタスクを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <returns>タスクとコメント数のタプル</returns>
    public async Task<(WorkspaceTask Task, int CommentCount)> GetWorkspaceTaskAsync(
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

        var commentCount = await _context.TaskComments
            .CountAsync(c => c.WorkspaceTaskId == taskId);

        return (task, commentCount);
    }

    /// <summary>
    /// ワークスペースアイテムのタスク一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">フィルタリング・ページネーションリクエスト</param>
    /// <returns>タスク一覧、コメント数辞書、総件数のタプル</returns>
    public async Task<(List<WorkspaceTask> Tasks, Dictionary<int, int> CommentCounts, int TotalCount)> GetWorkspaceTasksAsync(
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
    /// <returns>更新されたタスクとコメント数のタプル</returns>
    public async Task<(WorkspaceTask Task, int CommentCount)> UpdateWorkspaceTaskAsync(
        int workspaceId,
        int itemId,
        int taskId,
        UpdateWorkspaceTaskRequest request
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

            var latestCommentCount = latestTask != null
                ? await _context.TaskComments.CountAsync(c => c.WorkspaceTaskId == taskId)
                : 0;

            throw new ConcurrencyException<WorkspaceTaskDetailResponse>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestTask != null ? BuildTaskDetailResponse(latestTask, latestCommentCount) : null
            );
        }

        _logger.LogInformation(
            "ワークスペースタスクを更新しました。TaskId={TaskId}, WorkspaceItemId={WorkspaceItemId}",
            task.Id,
            itemId
        );

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

        // コメント数を取得
        var commentCount = await _context.TaskComments
            .CountAsync(c => c.WorkspaceTaskId == taskId);

        return (task, commentCount);
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
    private static WorkspaceTaskDetailResponse BuildTaskDetailResponse(WorkspaceTask task, int commentCount = 0)
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
            })
            .ToDictionaryAsync(x => x.WorkspaceId);

        // レスポンスを構築
        var results = workspaces.Select(w => new MyCommitterWorkspaceResponse
        {
            WorkspaceId = w.WorkspaceId,
            WorkspaceCode = w.WorkspaceCode ?? string.Empty,
            WorkspaceName = w.WorkspaceName ?? string.Empty,
            GenreIcon = w.GenreIcon,
            GenreName = w.GenreName,
            ItemCount = w.ItemCount,
            ActiveTaskCount = taskStats.ContainsKey(w.WorkspaceId) ? taskStats[w.WorkspaceId].ActiveTaskCount : 0,
            CompletedTaskCount = taskStats.ContainsKey(w.WorkspaceId) ? taskStats[w.WorkspaceId].CompletedTaskCount : 0,
            OverdueTaskCount = taskStats.ContainsKey(w.WorkspaceId) ? taskStats[w.WorkspaceId].OverdueTaskCount : 0,
        })
        .OrderByDescending(w => w.ActiveTaskCount) // アクティブタスクが多い順
        .ThenBy(w => w.WorkspaceName)
        .ToList();

        return results;
    }
}
