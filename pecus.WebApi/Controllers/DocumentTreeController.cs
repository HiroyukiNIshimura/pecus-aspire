using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
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
    private readonly OrganizationAccessHelper _accessHelper;

    public DocumentTreeController(
        WorkspaceItemService itemService,
        OrganizationAccessHelper accessHelper,
        ILogger<DocumentTreeController> logger,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _itemService = itemService;
        _accessHelper = accessHelper;
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
}
