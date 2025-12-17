using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Services;
using System.Collections.Generic;

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

        var (task, commentCount, commentTypeCounts) = await _workspaceTaskService.GetWorkspaceTaskAsync(
            workspaceId,
            itemId,
            taskId
        );

        return TypedResults.Ok(BuildTaskDetailResponse(task, commentCount: commentCount, commentTypeCounts: commentTypeCounts));
    }

    /// <summary>
    /// シーケンス番号でタスク取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="sequence">タスクシーケンス番号（アイテム内で一意）</param>
    /// <returns>タスク詳細</returns>
    [HttpGet("sequence/{sequence}")]
    [ProducesResponseType(typeof(WorkspaceTaskDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceTaskDetailResponse>> GetWorkspaceTaskBySequence(
        int workspaceId,
        int itemId,
        int sequence
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var (task, commentCount, commentTypeCounts) = await _workspaceTaskService.GetWorkspaceTaskBySequenceAsync(
            workspaceId,
            itemId,
            sequence
        );

        return TypedResults.Ok(BuildTaskDetailResponse(task, commentCount: commentCount, commentTypeCounts: commentTypeCounts));
    }

    /// <summary>
    /// アイテムのタスク一覧取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">フィルタリング・ページネーションリクエスト</param>
    /// <returns>タスク一覧（統計情報付き）</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<WorkspaceTaskDetailResponse, WorkspaceTaskStatistics>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceTaskDetailResponse, WorkspaceTaskStatistics>>> GetWorkspaceTasks(
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

        var (tasks, commentCounts, commentTypeCounts, totalCount) = await _workspaceTaskService.GetWorkspaceTasksAsync(
            workspaceId,
            itemId,
            request
        );

        // 統計情報を取得
        var statistics = await _workspaceTaskService.GetWorkspaceTaskStatisticsAsync(
            workspaceId,
            itemId
        );

        var pageSize = request.PageSize;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        // ページネーション用のオフセット計算（無限スクロール対応）
        var offset = (request.Page - 1) * pageSize;

        var response = new PagedResponse<WorkspaceTaskDetailResponse, WorkspaceTaskStatistics>
        {
            Data = tasks.Select((t, index) => BuildTaskDetailResponse(
                t,
                listIndex: offset + index,
                commentCount: commentCounts.GetValueOrDefault(t.Id, 0),
                commentTypeCounts: commentTypeCounts.GetValueOrDefault(t.Id, new Dictionary<TaskCommentType, int>())
            )),
            CurrentPage = request.Page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPreviousPage = request.Page > 1,
            HasNextPage = request.Page < totalPages,
            Summary = statistics,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タスクフローマップ取得
    /// アイテム内のタスク依存関係を可視化するためのデータを取得します
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <returns>タスクフローマップ</returns>
    [HttpGet("flow-map")]
    [ProducesResponseType(typeof(TaskFlowMapResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TaskFlowMapResponse>> GetTaskFlowMap(
        int workspaceId,
        int itemId
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var response = await _workspaceTaskService.GetTaskFlowMapAsync(workspaceId, itemId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 担当者のタスク負荷を期限日ごとにチェック
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">チェックリクエスト</param>
    /// <returns>担当者の期限日別タスク負荷</returns>
    [HttpGet("assignee-load-check")]
    [ProducesResponseType(typeof(AssigneeTaskLoadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AssigneeTaskLoadResponse>> CheckAssigneeTaskLoad(
        int workspaceId,
        int itemId,
        [FromQuery] CheckAssigneeTaskLoadRequest request
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
            throw new InvalidOperationException("ワークスペースのメンバーのみがタスクを確認できます。");
        }

        var response = await _workspaceTaskService.CheckAssigneeTaskLoadAsync(
            workspaceId,
            itemId,
            request
        );

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

        var (task, commentCount, commentTypeCounts) = await _workspaceTaskService.UpdateWorkspaceTaskAsync(
            workspaceId,
            itemId,
            taskId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceTaskResponse
        {
            Success = true,
            Message = "タスクを更新しました。",
            WorkspaceTask = BuildTaskDetailResponse(task, commentCount: commentCount, commentTypeCounts: commentTypeCounts),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// WorkspaceItemエンティティからレスポンスを生成
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
            Mode = item.Workspace?.Mode,
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
    /// <param name="listIndex">リスト内でのインデックス（Reactのkey用）</param>
    /// <param name="commentCount">コメント数</param>
    /// <param name="commentTypeCounts">コメントタイプ別件数</param>
    private static WorkspaceTaskDetailResponse BuildTaskDetailResponse(
        WorkspaceTask task,
        int listIndex = 0,
        int commentCount = 0,
        Dictionary<TaskCommentType, int>? commentTypeCounts = null
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
            PredecessorTaskId = task.PredecessorTaskId,
            PredecessorTask = task.PredecessorTask != null ? new PredecessorTaskInfo
            {
                Id = task.PredecessorTask.Id,
                Sequence = task.PredecessorTask.Sequence,
                Content = task.PredecessorTask.Content,
                IsCompleted = task.PredecessorTask.IsCompleted,
                WorkspaceItemCode = null  // 一覧では不要
            } : null,
            RowVersion = task.RowVersion,
        };
    }
}