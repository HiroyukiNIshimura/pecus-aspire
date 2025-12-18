using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// タスクコメントコントローラー
/// タスクに対するコメントの管理を行います
/// </summary>
[Route("api/workspaces/{workspaceId}/items/{itemId}/tasks/{taskId}/comments")]
[Produces("application/json")]
[Tags("TaskComment")]
public class TaskCommentController : BaseSecureController
{
    private readonly TaskCommentService _taskCommentService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly PecusConfig _config;
    private readonly ILogger<TaskCommentController> _logger;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly FrontendUrlResolver _frontendUrlResolver;

    public TaskCommentController(
        TaskCommentService taskCommentService,
        OrganizationAccessHelper accessHelper,
        PecusConfig config,
        ProfileService profileService,
        ILogger<TaskCommentController> logger,
        IBackgroundJobClient backgroundJobClient,
        FrontendUrlResolver frontendUrlResolver
    ) : base(profileService, logger)
    {
        _taskCommentService = taskCommentService;
        _accessHelper = accessHelper;
        _config = config;
        _logger = logger;
        _backgroundJobClient = backgroundJobClient;
        _frontendUrlResolver = frontendUrlResolver;
    }

    /// <summary>
    /// コメント一覧取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="request">フィルタリング・ページネーションリクエスト</param>
    /// <returns>コメント一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<TaskCommentDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<TaskCommentDetailResponse>>> GetTaskComments(
        int workspaceId,
        int itemId,
        int taskId,
        [FromQuery] GetTaskCommentsRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var (comments, totalCount) = await _taskCommentService.GetTaskCommentsAsync(
            workspaceId,
            itemId,
            taskId,
            request
        );

        var pageSize = _config.Pagination.DefaultPageSize;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var response = new PagedResponse<TaskCommentDetailResponse>
        {
            Data = comments.Select(BuildCommentDetailResponse),
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
    /// コメント取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="commentId">コメントID</param>
    /// <returns>コメント詳細</returns>
    [HttpGet("{commentId}")]
    [ProducesResponseType(typeof(TaskCommentDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TaskCommentDetailResponse>> GetTaskComment(
        int workspaceId,
        int itemId,
        int taskId,
        int commentId
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("コメントが見つかりません。");
        }

        var comment = await _taskCommentService.GetTaskCommentAsync(
            workspaceId,
            itemId,
            taskId,
            commentId
        );

        return TypedResults.Ok(BuildCommentDetailResponse(comment));
    }

    /// <summary>
    /// コメント作成
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="request">作成リクエスト</param>
    /// <returns>作成されたコメント</returns>
    [HttpPost]
    [ProducesResponseType(typeof(TaskCommentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TaskCommentResponse>> CreateTaskComment(
        int workspaceId,
        int itemId,
        int taskId,
        [FromBody] CreateTaskCommentRequest request
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
                "ワークスペースのメンバーのみがコメントを作成できます。"
            );
        }

        var comment = await _taskCommentService.CreateTaskCommentAsync(
            workspaceId,
            itemId,
            taskId,
            request,
            CurrentUserId
        );

        // 督促コメントの場合、タスク担当者にメール送信
        if (request.CommentType == TaskCommentType.Reminder)
        {
            await SendReminderEmailAsync(workspaceId, itemId, taskId, comment);
        }

        // ヘルプコメントの場合、通知先ユーザーにメール送信
        if (request.CommentType == TaskCommentType.HelpWanted)
        {
            await SendHelpEmailAsync(workspaceId, itemId, taskId, comment);
        }

        var response = new TaskCommentResponse
        {
            Success = true,
            Message = "コメントを作成しました。",
            TaskComment = BuildCommentDetailResponse(comment),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// コメント更新（作成者のみ）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="commentId">コメントID</param>
    /// <param name="request">更新リクエスト</param>
    /// <returns>更新されたコメント</returns>
    [HttpPut("{commentId}")]
    [ProducesResponseType(typeof(TaskCommentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<TaskCommentDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TaskCommentResponse>> UpdateTaskComment(
        int workspaceId,
        int itemId,
        int taskId,
        int commentId,
        [FromBody] UpdateTaskCommentRequest request
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
                "ワークスペースのメンバーのみがコメントを更新できます。"
            );
        }

        var comment = await _taskCommentService.UpdateTaskCommentAsync(
            workspaceId,
            itemId,
            taskId,
            commentId,
            request,
            CurrentUserId
        );

        var response = new TaskCommentResponse
        {
            Success = true,
            Message = "コメントを更新しました。",
            TaskComment = BuildCommentDetailResponse(comment),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// コメント削除（無効化、作成者のみ）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="commentId">コメントID</param>
    /// <param name="request">削除リクエスト</param>
    /// <returns>削除結果</returns>
    [HttpDelete("{commentId}")]
    [ProducesResponseType(typeof(TaskCommentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<TaskCommentDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TaskCommentResponse>> DeleteTaskComment(
        int workspaceId,
        int itemId,
        int taskId,
        int commentId,
        [FromBody] DeleteTaskCommentRequest request
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
                "ワークスペースのメンバーのみがコメントを削除できます。"
            );
        }

        var comment = await _taskCommentService.DeleteTaskCommentAsync(
            workspaceId,
            itemId,
            taskId,
            commentId,
            request,
            CurrentUserId
        );

        var response = new TaskCommentResponse
        {
            Success = true,
            Message = "コメントを削除しました。",
            TaskComment = BuildCommentDetailResponse(comment),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 督促コメント時にタスク担当者へメール送信
    /// </summary>
    private async Task SendReminderEmailAsync(
        int workspaceId,
        int itemId,
        int taskId,
        TaskComment comment
    )
    {
        // タスク情報を取得（担当者、ワークスペース、アイテム情報を含む）
        var taskInfo = await _taskCommentService.GetTaskWithDetailsForEmailAsync(taskId);
        if (taskInfo == null)
        {
            _logger.LogWarning(
                "督促メール送信: タスク情報が取得できませんでした。TaskId={TaskId}",
                taskId
            );
            return;
        }

        // 担当者のメールアドレスがない場合はスキップ
        if (string.IsNullOrEmpty(taskInfo.AssignedUser?.Email))
        {
            _logger.LogWarning(
                "督促メール送信: 担当者のメールアドレスがありません。TaskId={TaskId}, AssignedUserId={AssignedUserId}",
                taskId,
                taskInfo.AssignedUserId
            );
            return;
        }

        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl(HttpContext);
        var itemUrl = $"{baseUrl}/workspaces/{taskInfo.Workspace?.Code}?itemCode={taskInfo.WorkspaceItem?.Code}&task={taskInfo.Sequence}";

        var emailModel = new ReminderCommentEmailModel
        {
            UserName = taskInfo.AssignedUser.Username,
            RemindedByName = CurrentUser?.Username ?? "",
            ItemTitle = taskInfo.WorkspaceItem?.Subject ?? "",
            ItemCode = taskInfo.WorkspaceItem?.Code,
            TaskContent = taskInfo.Content,
            TaskPriority = taskInfo.Priority?.ToString(),
            TaskAssigneeName = taskInfo.AssignedUser.Username,
            CommentBody = comment.Content,
            CommentedAt = comment.CreatedAt,
            TaskDueDate = taskInfo.DueDate,
            WorkspaceName = taskInfo.Workspace?.Name ?? "",
            WorkspaceCode = taskInfo.Workspace?.Code ?? "",
            ItemUrl = itemUrl,
            OrganizationName = taskInfo.Organization?.Name ?? "",
        };

        _backgroundJobClient.Enqueue<EmailTasks>(x =>
            x.SendTemplatedEmailAsync(
                taskInfo.AssignedUser.Email,
                "タスクへの督促コメントが届きました",
                emailModel
            )
        );

        _logger.LogInformation(
            "督促メールをキューに追加しました。TaskId={TaskId}, To={Email}",
            taskId,
            taskInfo.AssignedUser.Email
        );
    }

    /// <summary>
    /// ヘルプコメント時に通知先ユーザーへメール送信
    /// </summary>
    private async Task SendHelpEmailAsync(
        int workspaceId,
        int itemId,
        int taskId,
        TaskComment comment
    )
    {
        // タスク情報を取得
        var taskInfo = await _taskCommentService.GetTaskWithDetailsForEmailAsync(taskId);
        if (taskInfo == null)
        {
            _logger.LogWarning(
                "ヘルプメール送信: タスク情報が取得できませんでした。TaskId={TaskId}",
                taskId
            );
            return;
        }

        // 通知先ユーザー一覧を取得（OrganizationSettingのHelpNotificationTargetに基づく）
        var targetUsers = await _taskCommentService.GetHelpNotificationTargetUsersAsync(
            taskInfo.OrganizationId,
            workspaceId,
            CurrentUserId // コメント作成者は除外
        );

        if (targetUsers.Count == 0)
        {
            _logger.LogInformation(
                "ヘルプメール送信: 通知先ユーザーがいません。TaskId={TaskId}",
                taskId
            );
            return;
        }

        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl(HttpContext);
        var itemUrl = $"{baseUrl}/workspaces/{taskInfo.Workspace?.Code}?itemCode={taskInfo.WorkspaceItem?.Code}&task={taskInfo.Sequence}";

        // 各ユーザーにメール送信ジョブを登録
        foreach (var user in targetUsers)
        {
            if (string.IsNullOrEmpty(user.Email))
            {
                continue;
            }

            var emailModel = new HelpCommentEmailModel
            {
                UserName = user.Username,
                RequesterName = CurrentUser?.Username ?? "",
                ItemTitle = taskInfo.WorkspaceItem?.Subject ?? "",
                ItemCode = taskInfo.WorkspaceItem?.Code,
                TaskContent = taskInfo.Content,
                TaskPriority = taskInfo.Priority?.ToString(),
                TaskAssigneeName = taskInfo.AssignedUser?.Username,
                CommentBody = comment.Content,
                CommentedAt = comment.CreatedAt,
                WorkspaceName = taskInfo.Workspace?.Name ?? "",
                WorkspaceCode = taskInfo.Workspace?.Code ?? "",
                ItemUrl = itemUrl,
                OrganizationName = taskInfo.Organization?.Name ?? "",
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    user.Email,
                    "ヘルプが求められています",
                    emailModel
                )
            );
        }

        _logger.LogInformation(
            "ヘルプメールをキューに追加しました。TaskId={TaskId}, TargetCount={Count}",
            taskId,
            targetUsers.Count
        );
    }

    /// <summary>
    /// TaskCommentエンティティからレスポンスを生成
    /// </summary>
    private static TaskCommentDetailResponse BuildCommentDetailResponse(TaskComment comment)
    {
        return new TaskCommentDetailResponse
        {
            Id = comment.Id,
            WorkspaceTaskId = comment.WorkspaceTaskId,
            UserId = comment.UserId,
            Username = comment.User?.Username,
            AvatarUrl = comment.User != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: comment.User.AvatarType,
                    userId: comment.User.Id,
                    username: comment.User.Username,
                    email: comment.User.Email,
                    avatarPath: comment.User.UserAvatarPath
                )
                : null,
            Content = comment.Content,
            CommentType = comment.CommentType,
            IsDeleted = comment.IsDeleted,
            DeletedAt = comment.DeletedAt,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            RowVersion = comment.RowVersion,
        };
    }
}