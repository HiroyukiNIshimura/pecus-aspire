using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.WorkspaceItem;
using Pecus.Services;

namespace Pecus.Controllers;

[ApiController]
[Produces("application/json")]
public class WorkspaceItemPinController : ControllerBase
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly WorkspaceItemPinService _pinService;
    private readonly WorkspaceAccessHelper _accessHelper;
    private readonly ILogger<WorkspaceItemPinController> _logger;
    private readonly PecusConfig _config;

    public WorkspaceItemPinController(
        WorkspaceItemService workspaceItemService,
        WorkspaceItemPinService pinService,
        WorkspaceAccessHelper accessHelper,
        ILogger<WorkspaceItemPinController> logger,
        PecusConfig config
    )
    {
        _workspaceItemService = workspaceItemService;
        _pinService = pinService;
        _accessHelper = accessHelper;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// ワークスペースアイテムにPINを追加
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>更新されたワークスペースアイテム</returns>
    [HttpPost("api/workspaces/{workspaceId}/items/{itemId}/pin")]
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

            var pin = await _pinService.AddPinToItemAsync(workspaceId, itemId, me);

            // 更新後のアイテムを取得
            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "PINを追加しました。",
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
    [HttpDelete("api/workspaces/{workspaceId}/items/{itemId}/pin")]
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

            await _pinService.RemovePinFromItemAsync(workspaceId, itemId, me);

            // 更新後のアイテムを取得
            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "PINを削除しました。",
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
            _logger.LogError(ex, "PIN削除中にエラーが発生しました。ItemId: {ItemId}", itemId);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログインユーザーがPINしたアイテム一覧を取得
    /// </summary>
    [HttpGet("api/users/me/pinned-items")]
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
    > GetMyPinnedItems([FromQuery] GetMyPinnedItemsRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var pageSize = _config.Pagination.DefaultPageSize;
            var (items, totalCount) = await _workspaceItemService.GetPinnedWorkspaceItemsAsync(
                me,
                request.Page,
                pageSize
            );

            var itemResponses = items
                .Select(item => WorkspaceItemResponseHelper.BuildItemDetailResponse(item, me))
                .ToList();

            var response = PaginationHelper.CreatePagedResponse(
                data: itemResponses,
                totalCount: totalCount,
                page: request.Page,
                pageSize: pageSize
            );

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PIN済みアイテム一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
