using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Image;
using Pecus.Models.Config;
using Pecus.Models.Requests.WorkspaceItem;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.WorkspaceItem;
using Pecus.Services;

namespace Pecus.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId}/items")]
[Produces("application/json")]
public class WorkspaceItemController : ControllerBase
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly WorkspaceItemAttachmentService _attachmentService;
    private readonly WorkspaceItemPinService _pinService;
    private readonly WorkspaceItemTagService _tagService;
    private readonly ILogger<WorkspaceItemController> _logger;
    private readonly PecusConfig _config;

    public WorkspaceItemController(
        WorkspaceItemService workspaceItemService,
        WorkspaceItemAttachmentService attachmentService,
        WorkspaceItemPinService pinService,
        WorkspaceItemTagService tagService,
        ILogger<WorkspaceItemController> logger,
        PecusConfig config
    )
    {
        _workspaceItemService = workspaceItemService;
        _attachmentService = attachmentService;
        _pinService = pinService;
        _tagService = tagService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// WorkspaceItemからWorkspaceItemDetailResponseを構築するヘルパーメソッド
    /// </summary>
    /// <param name="item">ワークスペースアイテム</param>
    /// <param name="currentUserId">ログイン中のユーザーID（null可）</param>
    /// <returns>WorkspaceItemDetailResponse</returns>
    private WorkspaceItemDetailResponse BuildItemDetailResponse(
        Pecus.Libs.DB.Models.WorkspaceItem item,
        int? currentUserId
    )
    {
        return new WorkspaceItemDetailResponse
        {
            Id = item.Id,
            WorkspaceId = item.WorkspaceId,
            WorkspaceName = item.Workspace?.Name,
            Code = item.Code,
            Subject = item.Subject,
            Body = item.Body,
            OwnerId = item.OwnerId,
            OwnerUsername = item.Owner?.Username,
            OwnerAvatarUrl =
                item.Owner != null
                    ? IdentityIconHelper.GetIdentityIconUrl(
                        item.Owner.AvatarType,
                        item.Owner.Id,
                        item.Owner.Username,
                        item.Owner.Email,
                        item.Owner.AvatarUrl
                    )
                    : null,
            AssigneeId = item.AssigneeId,
            AssigneeUsername = item.Assignee?.Username,
            AssigneeAvatarUrl =
                item.Assignee != null
                    ? IdentityIconHelper.GetIdentityIconUrl(
                        item.Assignee.AvatarType,
                        item.Assignee.Id,
                        item.Assignee.Username,
                        item.Assignee.Email,
                        item.Assignee.AvatarUrl
                    )
                    : null,
            Priority = item.Priority,
            DueDate = item.DueDate,
            IsArchived = item.IsArchived,
            IsDraft = item.IsDraft,
            CommitterId = item.CommitterId,
            CommitterUsername = item.Committer?.Username,
            CommitterAvatarUrl =
                item.Committer != null
                    ? IdentityIconHelper.GetIdentityIconUrl(
                        item.Committer.AvatarType,
                        item.Committer.Id,
                        item.Committer.Username,
                        item.Committer.Email,
                        item.Committer.AvatarUrl
                    )
                    : null,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
            Tags =
                item.WorkspaceItemTags?.Select(wit => new TagInfoResponse
                    {
                        Id = wit.Tag?.Id ?? 0,
                        Name = wit.Tag?.Name ?? string.Empty,
                    })
                    .Where(tag => tag.Id > 0 && !string.IsNullOrEmpty(tag.Name))
                    .ToList() ?? new List<TagInfoResponse>(),
            IsPinned =
                currentUserId.HasValue
                && item.WorkspaceItemPins != null
                && item.WorkspaceItemPins.Any(wip => wip.UserId == currentUserId.Value),
            PinCount = item.WorkspaceItemPins?.Count ?? 0,
        };
    }

    /// <summary>
    /// ワークスペースアイテム作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > CreateWorkspaceItem(int workspaceId, [FromBody] CreateWorkspaceItemRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? ownerId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                ownerId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!ownerId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            var item = await _workspaceItemService.CreateWorkspaceItemAsync(
                workspaceId,
                request,
                ownerId.Value
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムを作成しました。",
                WorkspaceItem = BuildItemDetailResponse(item, ownerId.Value),
            };

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ワークスペースアイテム作成中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテム取得
    /// </summary>
    [HttpGet("{itemId}")]
    [ProducesResponseType(typeof(WorkspaceItemDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<WorkspaceItemDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetWorkspaceItem(int workspaceId, int itemId)
    {
        try
        {
            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            // ログイン中のユーザーIDを取得（任意）
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            var response = BuildItemDetailResponse(item, currentUserId);

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースアイテム取得中にエラーが発生しました。ItemId: {ItemId}",
                itemId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテム一覧取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceItemDetailResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<PagedResponse<WorkspaceItemDetailResponse>>, StatusCodeHttpResult>
    > GetWorkspaceItems(
        int workspaceId,
        [FromQuery] int page = 1,
        [FromQuery] bool? isDraft = null,
        [FromQuery] bool? isArchived = null,
        [FromQuery] int? assigneeId = null,
        [FromQuery] int? priority = null,
        [FromQuery] bool? pinned = null
    )
    {
        try
        {
            // ログイン中のユーザーIDを取得（任意）
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            // pinnedフィルタを使用する場合は認証が必要
            int? pinnedByUserId = null;
            if (pinned.HasValue && pinned.Value)
            {
                if (!currentUserId.HasValue)
                {
                    // 認証されていない場合は空の結果を返す
                    var emptyResponse = PaginationHelper.CreatePagedResponse(
                        new List<WorkspaceItemDetailResponse>(),
                        page,
                        _config.Pagination.DefaultPageSize,
                        0
                    );
                    return TypedResults.Ok(emptyResponse);
                }
                pinnedByUserId = currentUserId.Value;
            }

            var pageSize = _config.Pagination.DefaultPageSize;
            var (items, totalCount) = await _workspaceItemService.GetWorkspaceItemsAsync(
                workspaceId,
                page,
                pageSize,
                isDraft,
                isArchived,
                assigneeId,
                priority,
                pinnedByUserId
            );

            var itemResponses = items
                .Select(item => BuildItemDetailResponse(item, currentUserId))
                .ToList();

            var response = PaginationHelper.CreatePagedResponse(
                itemResponses,
                page,
                pageSize,
                totalCount
            );

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースアイテム一覧取得中にエラーが発生しました。WorkspaceId: {WorkspaceId}",
                workspaceId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテム更新
    /// </summary>
    [HttpPatch("{itemId}")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateWorkspaceItem(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemRequest request
    )
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!currentUserId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            var item = await _workspaceItemService.UpdateWorkspaceItemAsync(
                workspaceId,
                itemId,
                request,
                currentUserId.Value
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムを更新しました。",
                WorkspaceItem = BuildItemDetailResponse(item, currentUserId.Value),
            };

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースアイテム更新中にエラーが発生しました。ItemId: {ItemId}",
                itemId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテムステータス更新
    /// </summary>
    [HttpPatch("{itemId}/status")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateWorkspaceItemStatus(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemStatusRequest request
    )
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!currentUserId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            var item = await _workspaceItemService.UpdateWorkspaceItemStatusAsync(
                workspaceId,
                itemId,
                request,
                currentUserId.Value
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムのステータスを更新しました。",
                WorkspaceItem = BuildItemDetailResponse(item, currentUserId.Value),
            };

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースアイテムステータス更新中にエラーが発生しました。ItemId: {ItemId}",
                itemId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテム削除
    /// </summary>
    [HttpDelete("{itemId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<SuccessResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > DeleteWorkspaceItem(int workspaceId, int itemId)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!currentUserId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            await _workspaceItemService.DeleteWorkspaceItemAsync(
                workspaceId,
                itemId,
                currentUserId.Value
            );

            var response = new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "ワークスペースアイテムを削除しました。",
            };

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースアイテム削除中にエラーが発生しました。ItemId: {ItemId}",
                itemId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテムのタグを一括設定
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="request">タグ一括設定リクエスト</param>
    /// <param name="httpContext">HTTPコンテキスト</param>
    /// <returns>更新されたワークスペースアイテム</returns>
    [HttpPut("/api/workspaces/{workspaceId}/items/{itemId}/tags")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            NotFound<ErrorResponse>,
            BadRequest<ErrorResponse>,
            StatusCodeHttpResult
        >
    > SetTagsToItem(
        int workspaceId,
        int itemId,
        [FromBody] SetTagsToItemRequest request,
        HttpContext httpContext
    )
    {
        try
        {
            // 認証チェック
            if (!httpContext.User.Identity?.IsAuthenticated ?? true)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status401Unauthorized,
                        Message = "認証が必要です。",
                    }
                );
            }

            var userId = JwtBearerUtil.GetUserIdFromPrincipal(httpContext.User);

            // タグを一括設定
            var tags = await _tagService.SetTagsToItemAsync(
                workspaceId,
                itemId,
                request.TagNames,
                userId
            );

            // 更新後のアイテムを取得
            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            // レスポンスを構築
            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "タグを設定しました。",
                WorkspaceItem = BuildItemDetailResponse(item, userId),
            };

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ一括設定中にエラーが発生しました。ItemId: {ItemId}", itemId);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテムにPINを追加
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>更新されたワークスペースアイテム</returns>
    [HttpPost("{itemId}/pin")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > AddPinToItem(int workspaceId, int itemId)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!userId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            var pin = await _pinService.AddPinToItemAsync(workspaceId, itemId, userId.Value);

            // 更新後のアイテムを取得
            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "PINを追加しました。",
                WorkspaceItem = BuildItemDetailResponse(item, userId.Value),
            };

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PIN追加中にエラーが発生しました。ItemId: {ItemId}", itemId);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテムからPINを削除
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>更新されたワークスペースアイテム</returns>
    [HttpDelete("{itemId}/pin")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > RemovePinFromItem(int workspaceId, int itemId)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!userId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            await _pinService.RemovePinFromItemAsync(workspaceId, itemId, userId.Value);

            // 更新後のアイテムを取得
            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "PINを削除しました。",
                WorkspaceItem = BuildItemDetailResponse(item, userId.Value),
            };

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PIN削除中にエラーが発生しました。ItemId: {ItemId}", itemId);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログインユーザーがPINしたアイテム一覧を取得
    /// </summary>
    [HttpGet("/api/users/me/pinned-items")]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceItemDetailResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<PagedResponse<WorkspaceItemDetailResponse>>,
            UnauthorizedHttpResult,
            StatusCodeHttpResult
        >
    > GetMyPinnedItems([FromQuery] int page = 1)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!userId.HasValue)
            {
                return TypedResults.Unauthorized();
            }

            var pageSize = _config.Pagination.DefaultPageSize;
            var (items, totalCount) = await _workspaceItemService.GetPinnedWorkspaceItemsAsync(
                userId.Value,
                page,
                pageSize
            );

            var itemResponses = items
                .Select(item => BuildItemDetailResponse(item, userId.Value))
                .ToList();

            var response = PaginationHelper.CreatePagedResponse(
                itemResponses,
                page,
                pageSize,
                totalCount
            );

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PIN済みアイテム一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテムに添付ファイルをアップロード
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="file">アップロードするファイル</param>
    /// <returns>アップロードされた添付ファイル情報</returns>
    [HttpPost("{itemId}/attachments")]
    [ProducesResponseType(typeof(WorkspaceItemAttachmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Created<WorkspaceItemAttachmentResponse>,
            BadRequest<ErrorResponse>,
            UnauthorizedHttpResult,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UploadAttachment(int workspaceId, int itemId, IFormFile file)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!userId.HasValue)
            {
                return TypedResults.Unauthorized();
            }

            if (file == null || file.Length == 0)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse { Message = "ファイルが指定されていません。" }
                );
            }

            // ファイル名とMIMEタイプを取得
            var fileName = Path.GetFileName(file.FileName);
            var mimeType = file.ContentType;

            // ファイルを保存するパスを生成
            var uploadsDir = Path.Combine(
                Directory.GetCurrentDirectory(),
                "uploads",
                "workspaces",
                workspaceId.ToString(),
                "items",
                itemId.ToString()
            );
            Directory.CreateDirectory(uploadsDir);

            var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
            var filePath = Path.Combine(uploadsDir, uniqueFileName);

            // ファイルを保存
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // ダウンロードURLを生成
            var downloadUrl =
                $"/api/workspaces/{workspaceId}/items/{itemId}/attachments/download/{uniqueFileName}";

            // 画像ファイルの場合、サムネイルパスを事前に計算
            string? thumbnailMediumPath = null;
            string? thumbnailSmallPath = null;

            if (ThumbnailHelper.IsImageFile(mimeType))
            {
                thumbnailMediumPath = ThumbnailHelper.GenerateThumbnailPath(filePath, "medium");
                thumbnailSmallPath = ThumbnailHelper.GenerateThumbnailPath(filePath, "small");
            }

            // DBに保存（サムネイルパスも保存）
            var attachment = await _attachmentService.AddAttachmentAsync(
                workspaceId,
                itemId,
                fileName,
                file.Length,
                mimeType,
                filePath,
                downloadUrl,
                thumbnailMediumPath,
                thumbnailSmallPath,
                userId.Value
            );

            // 画像ファイルの場合、バックグラウンドでサムネイル生成をキュー
            if (ThumbnailHelper.IsImageFile(mimeType))
            {
                var mediumSize = _config.FileUpload.ThumbnailMediumSize;
                var smallSize = _config.FileUpload.ThumbnailSmallSize;

                BackgroundJob.Enqueue<ImageTasks>(x =>
                    x.GenerateThumbnailsAsync(attachment.Id, filePath, mediumSize, smallSize)
                );
            }

            var response = new WorkspaceItemAttachmentResponse
            {
                Id = attachment.Id,
                WorkspaceItemId = attachment.WorkspaceItemId,
                FileName = attachment.FileName,
                FileSize = attachment.FileSize,
                MimeType = attachment.MimeType,
                DownloadUrl = attachment.DownloadUrl,
                ThumbnailMediumUrl = attachment.ThumbnailMediumPath,
                ThumbnailSmallUrl = attachment.ThumbnailSmallPath,
                UploadedAt = attachment.UploadedAt,
                UploadedByUserId = attachment.UploadedByUserId,
                UploadedByUsername = attachment.UploadedByUser?.Username,
            };

            return TypedResults.Created(
                $"/api/workspaces/{workspaceId}/items/{itemId}/attachments/{attachment.Id}",
                response
            );
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(new ErrorResponse { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "添付ファイルのアップロード中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテムの添付ファイル一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>添付ファイル一覧</returns>
    [HttpGet("{itemId}/attachments")]
    [ProducesResponseType(typeof(List<WorkspaceItemAttachmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<List<WorkspaceItemAttachmentResponse>>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > GetAttachments(int workspaceId, int itemId)
    {
        try
        {
            var attachments = await _attachmentService.GetAttachmentsAsync(workspaceId, itemId);

            var response = attachments
                .Select(a => new WorkspaceItemAttachmentResponse
                {
                    Id = a.Id,
                    WorkspaceItemId = a.WorkspaceItemId,
                    FileName = a.FileName,
                    FileSize = a.FileSize,
                    MimeType = a.MimeType,
                    DownloadUrl = a.DownloadUrl,
                    ThumbnailMediumUrl = a.ThumbnailMediumPath,
                    ThumbnailSmallUrl = a.ThumbnailSmallPath,
                    UploadedAt = a.UploadedAt,
                    UploadedByUserId = a.UploadedByUserId,
                    UploadedByUsername = a.UploadedByUser?.Username,
                })
                .ToList();

            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "添付ファイル一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 添付ファイルを削除
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="attachmentId">添付ファイルID</param>
    /// <returns>削除結果</returns>
    [HttpDelete("{itemId}/attachments/{attachmentId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<NoContent, UnauthorizedHttpResult, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeleteAttachment(int workspaceId, int itemId, int attachmentId)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!userId.HasValue)
            {
                return TypedResults.Unauthorized();
            }

            var attachment = await _attachmentService.DeleteAttachmentAsync(
                workspaceId,
                itemId,
                attachmentId,
                userId.Value
            );

            // 物理ファイルを削除
            if (System.IO.File.Exists(attachment.FilePath))
            {
                System.IO.File.Delete(attachment.FilePath);
            }

            // サムネイルも削除
            if (
                !string.IsNullOrEmpty(attachment.ThumbnailMediumPath)
                && System.IO.File.Exists(attachment.ThumbnailMediumPath)
            )
            {
                System.IO.File.Delete(attachment.ThumbnailMediumPath);
            }

            if (
                !string.IsNullOrEmpty(attachment.ThumbnailSmallPath)
                && System.IO.File.Exists(attachment.ThumbnailSmallPath)
            )
            {
                System.IO.File.Delete(attachment.ThumbnailSmallPath);
            }

            return TypedResults.NoContent();
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "添付ファイル削除中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
