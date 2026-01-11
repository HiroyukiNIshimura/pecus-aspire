using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/workspaces/{workspaceId}/items/{itemId}")]
[Produces("application/json")]
[Tags("WorkspaceItem")]
public class WorkspaceItemTagController : BaseSecureController
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly WorkspaceItemTagService _tagService;
    private readonly OrganizationAccessHelper _accessHelper;

    public WorkspaceItemTagController(
        WorkspaceItemService workspaceItemService,
        WorkspaceItemTagService tagService,
        OrganizationAccessHelper accessHelper,
        ILogger<WorkspaceItemTagController> logger,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _workspaceItemService = workspaceItemService;
        _tagService = tagService;
        _accessHelper = accessHelper;
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
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceItemDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> SetTagsToItem(
        int workspaceId,
        int itemId,
        [FromBody] SetTagsToItemRequest request
    )
    {
        // ワークスペースへのアクセス権限と編集権限をチェック（Viewerは403）
        await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        // タグを一括設定（楽観的ロック対応）
        var tags = await _tagService.SetTagsToItemAsync(
            workspaceId: workspaceId,
            itemId: itemId,
            tagNames: request.Tags,
            userId: CurrentUserId,
            itemRowVersion: request.ItemRowVersion
        );

        // 更新後のアイテムを取得
        var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

        // レスポンスを構築
        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "タグを設定しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }
}