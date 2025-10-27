using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
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
    private readonly WorkspaceAccessHelper _accessHelper;
    private readonly ILogger<WorkspaceItemController> _logger;
    private readonly PecusConfig _config;

    public WorkspaceItemController(
        WorkspaceItemService workspaceItemService,
        WorkspaceAccessHelper accessHelper,
        ILogger<WorkspaceItemController> logger,
        PecusConfig config
    )
    {
        _workspaceItemService = workspaceItemService;
        _accessHelper = accessHelper;
        _logger = logger;
        _config = config;
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
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ワークスペースへのアクセス権限をチェック
            var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(me, workspaceId);
            if (!hasAccess)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var item = await _workspaceItemService.CreateWorkspaceItemAsync(
                workspaceId,
                request,
                me
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムを作成しました。",
                WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, me),
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
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ワークスペースへのアクセス権限をチェック
            var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(me, workspaceId);
            if (!hasAccess)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースアイテムが見つかりません。",
                    }
                );
            }

            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            var response = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, me);

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
        [FromQuery] GetWorkspaceItemsRequest request
    )
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ワークスペースへのアクセス権限をチェック
            var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(me, workspaceId);
            if (!hasAccess)
            {
                // 空の結果を返す
                var emptyResponse = PaginationHelper.CreatePagedResponse(
                    new List<WorkspaceItemDetailResponse>(),
                    request.Page,
                    _config.Pagination.DefaultPageSize,
                    0
                );
                return TypedResults.Ok(emptyResponse);
            }

            // pinnedフィルタを使用する場合は認証が必要
            int? pinnedByUserId = null;
            if (request.Pinned.HasValue && request.Pinned.Value)
            {
                pinnedByUserId = me;
            }

            var pageSize = _config.Pagination.DefaultPageSize;
            var (items, totalCount) = await _workspaceItemService.GetWorkspaceItemsAsync(
                workspaceId,
                request.Page,
                pageSize,
                request.IsDraft,
                request.IsArchived,
                request.AssigneeId,
                request.Priority,
                pinnedByUserId
            );

            var itemResponses = items
                .Select(item =>
                    WorkspaceItemResponseHelper.BuildItemDetailResponse(item, me)
                )
                .ToList();

            var response = PaginationHelper.CreatePagedResponse(
                itemResponses,
                request.Page,
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
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ワークスペースへのアクセス権限をチェック
            var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(me, workspaceId);
            if (!hasAccess)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var item = await _workspaceItemService.UpdateWorkspaceItemAsync(
                workspaceId,
                itemId,
                request,
                me
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムを更新しました。",
                WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(
                    item,
                    me
                ),
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
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ワークスペースへのアクセス権限をチェック
            var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(me, workspaceId);
            if (!hasAccess)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var item = await _workspaceItemService.UpdateWorkspaceItemStatusAsync(
                workspaceId,
                itemId,
                request,
                me
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムのステータスを更新しました。",
                WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(
                    item,
                    me
                ),
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
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ワークスペースへのアクセス権限をチェック
            var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(me, workspaceId);
            if (!hasAccess)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            await _workspaceItemService.DeleteWorkspaceItemAsync(
                workspaceId,
                itemId,
                me
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
}
