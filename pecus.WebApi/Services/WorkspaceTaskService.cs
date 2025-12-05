using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// ワークスペースタスクサービス
/// </summary>
public class WorkspaceTaskService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkspaceTaskService> _logger;
    private readonly OrganizationAccessHelper _accessHelper;

    public WorkspaceTaskService(
        ApplicationDbContext context,
        ILogger<WorkspaceTaskService> logger,
        OrganizationAccessHelper accessHelper
    )
    {
        _context = context;
        _logger = logger;
        _accessHelper = accessHelper;
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
        var overdueCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate.HasValue && t.DueDate.Value < todayStart);
        var dueTodayCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate.HasValue && t.DueDate.Value >= todayStart && t.DueDate.Value < todayEnd);
        var dueSoonCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate.HasValue && t.DueDate.Value >= todayEnd && t.DueDate.Value < sevenDaysLaterEnd);
        var noDueDateCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && !t.DueDate.HasValue);
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
            NoDueDateCount = noDueDateCount,
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

        if (request.DueDate.HasValue)
        {
            task.DueDate = request.DueDate.Value;
        }

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
}
