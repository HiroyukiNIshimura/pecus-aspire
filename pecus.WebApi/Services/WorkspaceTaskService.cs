using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.WorkspaceTask;
using Pecus.Models.Responses.WorkspaceTask;

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
            TaskType = request.TaskType,
            Priority = request.Priority,
            StartDate = request.StartDate,
            DueDate = request.DueDate,
            EstimatedHours = request.EstimatedHours,
            DisplayOrder = request.DisplayOrder,
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

        return task;
    }

    /// <summary>
    /// ワークスペースタスクを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <returns>タスク</returns>
    public async Task<WorkspaceTask> GetWorkspaceTaskAsync(
        int workspaceId,
        int itemId,
        int taskId
    )
    {
        var task = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .FirstOrDefaultAsync(t =>
                t.Id == taskId &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (task == null)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        return task;
    }

    /// <summary>
    /// ワークスペースアイテムのタスク一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <returns>タスク一覧</returns>
    public async Task<List<WorkspaceTask>> GetWorkspaceTasksAsync(
        int workspaceId,
        int itemId
    )
    {
        // ワークスペースアイテムの存在確認
        var itemExists = await _context.WorkspaceItems
            .AnyAsync(wi => wi.Id == itemId && wi.WorkspaceId == workspaceId);

        if (!itemExists)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var tasks = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Where(t => t.WorkspaceItemId == itemId && t.WorkspaceId == workspaceId)
            .OrderBy(t => t.DisplayOrder)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tasks;
    }

    /// <summary>
    /// ワークスペースタスクを更新
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="request">更新リクエスト</param>
    /// <returns>更新されたタスク</returns>
    public async Task<WorkspaceTask> UpdateWorkspaceTaskAsync(
        int workspaceId,
        int itemId,
        int taskId,
        UpdateWorkspaceTaskRequest request
    )
    {
        var task = await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
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

        if (request.TaskType.HasValue)
        {
            task.TaskType = request.TaskType.Value;
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

        if (request.DisplayOrder.HasValue)
        {
            task.DisplayOrder = request.DisplayOrder.Value;
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
                .FirstOrDefaultAsync(t => t.Id == taskId);

            throw new ConcurrencyException<WorkspaceTaskDetailResponse>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestTask != null ? BuildTaskDetailResponse(latestTask) : null
            );
        }

        _logger.LogInformation(
            "ワークスペースタスクを更新しました。TaskId={TaskId}, WorkspaceItemId={WorkspaceItemId}",
            task.Id,
            itemId
        );

        // ナビゲーションプロパティを再読み込み（担当者が変更された場合）
        if (request.AssignedUserId.HasValue)
        {
            await _context.Entry(task)
                .Reference(t => t.AssignedUser)
                .LoadAsync();
        }

        return task;
    }

    /// <summary>
    /// WorkspaceTaskエンティティからレスポンスを生成（内部ヘルパー）
    /// </summary>
    private static WorkspaceTaskDetailResponse BuildTaskDetailResponse(WorkspaceTask task)
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
            TaskType = task.TaskType,
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
            DisplayOrder = task.DisplayOrder,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            RowVersion = task.RowVersion,
        };
    }
}
