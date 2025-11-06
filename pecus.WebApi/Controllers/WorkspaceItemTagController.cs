using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests.WorkspaceItem;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.WorkspaceItem;
using Pecus.Services;

namespace Pecus.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId}/items/{itemId}")]
[Produces("application/json")]
public class WorkspaceItemTagController : ControllerBase
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly WorkspaceItemTagService _tagService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<WorkspaceItemTagController> _logger;

    public WorkspaceItemTagController(
        WorkspaceItemService workspaceItemService,
        WorkspaceItemTagService tagService,
        OrganizationAccessHelper accessHelper,
        ILogger<WorkspaceItemTagController> logger
    )
    {
        _workspaceItemService = workspaceItemService;
        _tagService = tagService;
        _accessHelper = accessHelper;
        _logger = logger;
    }

    /// <summary>
    /// ワークスペースアイテムのタグを一括設定
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="request">タグ一括設定リクエスト</param>
    /// <returns>更新されたワークスペースアイテム</returns>
    [HttpPut("tags")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            NotFound<ErrorResponse>,
            BadRequest<ErrorResponse>,
            Conflict<ErrorResponse>,
            StatusCodeHttpResult
        >
    > SetTagsToItem(int workspaceId, int itemId, [FromBody] SetTagsToItemRequest request)
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

            // ユーザーがワークスペースのメンバーか確認
            var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(me, workspaceId);
            if (!isMember)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "ワークスペースのメンバーのみがタグを設定できます。",
                    }
                );
            }

            // タグを一括設定（楽観的ロック対応）
            var tags = await _tagService.SetTagsToItemAsync(
                workspaceId: workspaceId,
                itemId: itemId,
                tagRequests: request.Tags,
                userId: me,
                itemRowVersion: request.RowVersion
            );

            // 更新後のアイテムを取得
            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            // レスポンスを構築
            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "タグを設定しました。",
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
        catch (ConcurrencyException ex)
        {
            return TypedResults.Conflict(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status409Conflict,
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
}
