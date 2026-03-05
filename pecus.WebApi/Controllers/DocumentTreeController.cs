using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Models.Responses;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ドキュメントツリー用のコントローラー
/// ドキュメントモードのワークスペースで使用するツリー構造を取得するためのエンドポイント
/// </summary>
[Route("api/workspaces/{workspaceId}/document-tree")]
[Produces("application/json")]
[Tags("Workspace")]
public class DocumentTreeController : BaseSecureController
{
    private readonly WorkspaceItemService _itemService;
    public DocumentTreeController(
        WorkspaceItemService itemService,
        ILogger<DocumentTreeController> logger,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _itemService = itemService;
    }

    /// <summary>
    /// ドキュメントツリーを取得
    /// ワークスペース内の全アイテムと親子関係を解決して返す
    /// </summary>
    /// <remarks>
    /// このエンドポイントはドキュメントモードのワークスペースでのみ使用可能です。
    /// 通常モードのワークスペースで呼び出すと 400 Bad Request が返されます。
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(DocumentTreeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<DocumentTreeResponse>> GetDocumentTree(int workspaceId)
    {
        var response = await _itemService.GetDocumentTreeAsync(workspaceId, CurrentUserId);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ドキュメントツリー内の兄弟間ソート順を変更
    /// </summary>
    /// <remarks>
    /// 同じ親を持つ兄弟リスト内での並び順を変更します。
    /// NewIndex は 0始まりのインデックスで、移動先の位置を指定します。
    /// </remarks>
    [HttpPut("sibling-order")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<Ok<SuccessResponse>> UpdateSiblingOrder(
        int workspaceId,
        [FromBody] UpdateSiblingOrderRequest request
    )
    {
        await _itemService.UpdateSiblingOrderAsync(workspaceId, request, CurrentUserId);

        return TypedResults.Ok(new SuccessResponse
        {
            StatusCode = StatusCodes.Status200OK,
            Message = "ソート順を変更しました。"
        });
    }

    /// <summary>
    /// アイテムの親を変更（移動）
    /// </summary>
    [HttpPut("parent")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<Ok<SuccessResponse>> UpdateItemParent(
        int workspaceId,
        [FromBody] UpdateItemParentRequest request
    )
    {
        await _itemService.UpdateItemParentAsync(workspaceId, request, CurrentUserId);

        return TypedResults.Ok(new SuccessResponse
        {
            StatusCode = StatusCodes.Status200OK,
            Message = "アイテムの親を変更しました。"
        });
    }

}