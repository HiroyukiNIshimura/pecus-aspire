using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Models.Requests.WorkspaceTask;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// マイコミッターアイテムコントローラー
/// ログインユーザーがコミッターとして割り当てられたアイテムとタスクを取得
/// </summary>
[Route("api/my")]
[Produces("application/json")]
[Tags("My")]
public class MyCommitterItemController : BaseSecureController
{
    private readonly WorkspaceTaskService _workspaceTaskService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<MyCommitterItemController> _logger;
    private readonly PecusConfig _config;

    public MyCommitterItemController(
        WorkspaceTaskService workspaceTaskService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<MyCommitterItemController> logger,
        PecusConfig config
    ) : base(profileService, logger)
    {
        _workspaceTaskService = workspaceTaskService;
        _accessHelper = accessHelper;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// マイコミッターワークスペース一覧を取得
    /// ログインユーザーがコミッターとして割り当てられたアイテムを持つワークスペースの一覧を取得します
    /// </summary>
    /// <returns>ワークスペース一覧（アイテム数・タスク統計付き、期限日が古い順）</returns>
    [HttpGet("committer-workspaces")]
    [ProducesResponseType(typeof(List<MyCommitterWorkspaceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<MyCommitterWorkspaceResponse>>> GetMyCommitterWorkspaces()
    {
        var results = await _workspaceTaskService.GetMyCommitterWorkspacesAsync(CurrentUserId);
        return TypedResults.Ok(results);
    }

    /// <summary>
    /// 指定ワークスペース内のコミッタータスクを期限日グループで取得
    /// ログインユーザーがコミッターとして割り当てられたアイテムに紐づくタスクを期限日でグループ化して返します
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="filter">ダッシュボード用フィルター（省略時はActive）</param>
    /// <returns>期限日でグループ化されたタスク一覧</returns>
    [HttpGet("committer-workspaces/{workspaceId:int}/tasks")]
    [ProducesResponseType(typeof(List<TasksByDueDateResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<TasksByDueDateResponse>>> GetCommitterTasksByWorkspace(
        int workspaceId,
        [FromQuery] DashboardTaskFilter? filter = null)
    {
        // アクセス権チェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new Exceptions.NotFoundException("ワークスペースが見つかりません。");
        }

        var results = await _workspaceTaskService.GetCommitterTasksByWorkspaceAsync(CurrentUserId, workspaceId, filter);
        return TypedResults.Ok(results);
    }

    /// <summary>
    /// マイコミッターアイテム一覧を取得
    /// ログインユーザーがコミッターとして割り当てられたアイテムとそのタスクを取得します
    /// </summary>
    /// <param name="request">ワークスペースID・ページネーションリクエスト</param>
    /// <returns>アイテムとタスクのグループ化されたリスト</returns>
    [HttpGet("committer-items")]
    [ProducesResponseType(typeof(PagedResponse<ItemWithTasksResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<ItemWithTasksResponse>>> GetMyCommitterItems(
        [FromQuery] GetMyCommitterItemsRequest request
    )
    {
        // WorkspaceIdが指定されている場合はアクセス権限をチェック
        if (request.WorkspaceId.HasValue)
        {
            var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, request.WorkspaceId.Value);
            if (!hasAccess)
            {
                throw new Exceptions.NotFoundException("ワークスペースが見つかりません。");
            }
        }

        // ログインユーザーをコミッターIDとして使用
        var (results, totalCount, pageSize) = await _workspaceTaskService.GetTasksByCommitterAsync(
            workspaceId: request.WorkspaceId,
            committerId: CurrentUserId,
            page: request.Page
        );

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var responseData = results.Select(r => new ItemWithTasksResponse
        {
            Item = BuildTaskItemResponse(r.Item),
            Tasks = r.Tasks.Select(t => BuildTaskDetailResponse(t)),
        });

        var response = new PagedResponse<ItemWithTasksResponse>
        {
            Data = responseData,
            CurrentPage = request.Page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPreviousPage = request.Page > 1,
            HasNextPage = request.Page < totalPages,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// WorkspaceItemエンティティからTaskItemResponseを生成
    /// </summary>
    /// <param name="item">ワークスペースアイテムエンティティ</param>
    private static TaskItemResponse BuildTaskItemResponse(WorkspaceItem item)
    {
        return new TaskItemResponse
        {
            WorkspaceId = item.WorkspaceId,
            WorkspaceCode = item.Workspace?.Code,
            WorkspaceName = item.Workspace?.Name,
            GenreIcon = item.Workspace?.Genre?.Icon,
            GenreName = item.Workspace?.Genre?.Name,
            Code = item.Code,
            Subject = item.Subject,
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
            CommitterId = item.CommitterId,
            CommitterUsername = item.Committer?.Username,
            CommitterAvatarUrl = item.Committer != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: item.Committer.AvatarType,
                    userId: item.Committer.Id,
                    username: item.Committer.Username,
                    email: item.Committer.Email,
                    avatarPath: item.Committer.UserAvatarPath
                )
                : null,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
        };
    }

    /// <summary>
    /// WorkspaceTaskエンティティからレスポンスを生成
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