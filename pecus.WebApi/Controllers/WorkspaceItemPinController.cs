using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers;

[Produces("application/json")]
[Tags("WorkspaceItem")]
public class WorkspaceItemPinController : BaseSecureController
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly WorkspaceItemPinService _pinService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly PecusConfig _config;

    public WorkspaceItemPinController(
        WorkspaceItemService workspaceItemService,
        WorkspaceItemPinService pinService,
        OrganizationAccessHelper accessHelper,
        ILogger<WorkspaceItemPinController> logger,
        PecusConfig config,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _workspaceItemService = workspaceItemService;
        _pinService = pinService;
        _accessHelper = accessHelper;
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
    public async Task<Ok<WorkspaceItemResponse>> AddPinToItem(int workspaceId, int itemId)
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
            throw new InvalidOperationException("ワークスペースのメンバーのみがアイテムをPINできます。");
        }

        await _pinService.AddPinToItemAsync(workspaceId, itemId, CurrentUserId);

        // 更新後のアイテムを取得
        var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "PINを追加しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
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
    public async Task<Ok<WorkspaceItemResponse>> RemovePinFromItem(int workspaceId, int itemId)
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
                "ワークスペースのメンバーのみがアイテムのPINを削除できます。"
            );
        }

        await _pinService.RemovePinFromItemAsync(workspaceId, itemId, CurrentUserId);

        // 更新後のアイテムを取得
        var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "PINを削除しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
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
    public async Task<Ok<PagedResponse<WorkspaceItemDetailResponse>>> GetMyPinnedItems(
        [FromQuery] GetMyPinnedItemsRequest request
    )
    {
        var pageSize = _config.Pagination.DefaultPageSize;
        var (items, totalCount) = await _workspaceItemService.GetPinnedWorkspaceItemsAsync(
            CurrentUserId,
            request.Page,
            pageSize
        );

        var itemResponses = items
            .Select(item => WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId))
            .ToList();

        var response = PaginationHelper.CreatePagedResponse(
            data: itemResponses,
            totalCount: totalCount,
            page: request.Page,
            pageSize: pageSize
        );

        return TypedResults.Ok(response);
    }
}