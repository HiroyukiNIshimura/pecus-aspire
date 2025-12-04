using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.WorkspaceTask;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.WorkspaceTask;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ワークスペースタスクコントローラー
/// ワークスペースアイテムに紐づくタスクの管理を行います
/// </summary>
[Route("api/workspaces/{workspaceId}/items/{itemId}/tasks")]
[Produces("application/json")]
[Tags("WorkspaceTask")]
public class WorkspaceTaskController : BaseSecureController
{
    private readonly WorkspaceTaskService _workspaceTaskService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<WorkspaceTaskController> _logger;

    public WorkspaceTaskController(
        WorkspaceTaskService workspaceTaskService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<WorkspaceTaskController> logger
    ) : base(profileService, logger)
    {
        _workspaceTaskService = workspaceTaskService;
        _accessHelper = accessHelper;
        _logger = logger;
    }

    /// <summary>
    /// タスク作成
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">作成リクエスト</param>
    /// <returns>作成されたタスク</returns>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceTaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceTaskResponse>> CreateWorkspaceTask(
        int workspaceId,
        int itemId,
        [FromBody] CreateWorkspaceTaskRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがタスクを作成できます。"
            );
        }

        var task = await _workspaceTaskService.CreateWorkspaceTaskAsync(
            workspaceId,
            itemId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceTaskResponse
        {
            Success = true,
            Message = "タスクを作成しました。",
            WorkspaceTask = BuildTaskDetailResponse(task),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タスク取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <returns>タスク詳細</returns>
    [HttpGet("{taskId}")]
    [ProducesResponseType(typeof(WorkspaceTaskDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceTaskDetailResponse>> GetWorkspaceTask(
        int workspaceId,
        int itemId,
        int taskId
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var (task, commentCount) = await _workspaceTaskService.GetWorkspaceTaskAsync(
            workspaceId,
            itemId,
            taskId
        );

        return TypedResults.Ok(BuildTaskDetailResponse(task, commentCount));
    }

    /// <summary>
    /// アイテムのタスク一覧取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">フィルタリング・ページネーションリクエスト</param>
    /// <returns>タスク一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<WorkspaceTaskDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceTaskDetailResponse>>> GetWorkspaceTasks(
        int workspaceId,
        int itemId,
        [FromQuery] GetWorkspaceTasksRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var (tasks, commentCounts, totalCount) = await _workspaceTaskService.GetWorkspaceTasksAsync(
            workspaceId,
            itemId,
            request
        );

        var pageSize = request.PageSize;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var response = new PagedResponse<WorkspaceTaskDetailResponse>
        {
            Data = tasks.Select(t => BuildTaskDetailResponse(t, commentCounts.GetValueOrDefault(t.Id, 0))),
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
    /// タスク更新
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="request">更新リクエスト</param>
    /// <returns>更新されたタスク</returns>
    [HttpPut("{taskId}")]
    [ProducesResponseType(typeof(WorkspaceTaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceTaskDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceTaskResponse>> UpdateWorkspaceTask(
        int workspaceId,
        int itemId,
        int taskId,
        [FromBody] UpdateWorkspaceTaskRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがタスクを更新できます。"
            );
        }

        var (task, commentCount) = await _workspaceTaskService.UpdateWorkspaceTaskAsync(
            workspaceId,
            itemId,
            taskId,
            request
        );

        var response = new WorkspaceTaskResponse
        {
            Success = true,
            Message = "タスクを更新しました。",
            WorkspaceTask = BuildTaskDetailResponse(task, commentCount),
        };

        return TypedResults.Ok(response);
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
