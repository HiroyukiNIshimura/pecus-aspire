using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.DB;
using Pecus.Services;

namespace Pecus.Controllers.External;

/// <summary>
/// 外部公開APIコントローラー（APIキー認証）
/// 外部APIに関してはまだ仕様が固まっていないため、暫定的にこのコントローラーにまとめて実装しています。
/// </summary>
/// <remarks>
/// X-API-KEY ヘッダーによるAPIキー認証が必要です。
/// 組織スコープで動作し、認証されたキーの所属組織のデータのみアクセス可能です。
/// </remarks>
public class ExternalController : BaseExternalApiController
{
    private readonly IExternalWorkspaceItemService _externalWorkspaceItemService;

    public ExternalController(
        IExternalWorkspaceItemService externalWorkspaceItemService,
        ApplicationDbContext context,
        ILogger<ExternalController> logger)
        : base(context, logger)
    {
        _externalWorkspaceItemService = externalWorkspaceItemService;
    }

    /// <summary>
    /// 疎通確認用エンドポイント
    /// </summary>
    /// <remarks>
    /// 受け取ったメッセージをそのまま返却します。
    /// APIキー認証の疎通確認に使用してください。
    /// </remarks>
    [HttpPost("ping")]
    [ProducesResponseType(typeof(PingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public Ok<PingResponse> Ping([FromBody] PingRequest request)
    {
        return TypedResults.Ok(new PingResponse
        {
            Message = request.Message,
            OrganizationCode = GetOrganizationCode(),
            Timestamp = DateTimeOffset.UtcNow,
        });
    }

    /// <summary>
    /// 指定したワークスペースにアイテムを作成する
    /// </summary>
    /// <remarks>
    /// Markdown形式の本文をLexical JSON形式に変換して保存します。
    /// オーナーはワークスペースのメンバーである必要があります。
    /// </remarks>
    /// <param name="workspaceCode">ワークスペースコード</param>
    /// <param name="request">作成リクエスト</param>
    /// <returns>作成されたアイテム情報</returns>
    /// <response code="201">アイテムの作成に成功</response>
    /// <response code="400">リクエストが不正</response>
    /// <response code="401">認証エラー</response>
    /// <response code="404">ワークスペースまたはユーザーが見つからない</response>
    [HttpPost("workspaces/{workspaceCode}/items")]
    [ProducesResponseType(typeof(CreateExternalWorkspaceItemResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Created<CreateExternalWorkspaceItemResponse>> CreateWorkspaceItem(
        [FromRoute] string workspaceCode,
        [FromBody] CreateExternalWorkspaceItemRequest request)
    {
        var result = await _externalWorkspaceItemService.CreateItemAsync(
            CurrentOrganizationId,  // 基底クラスのプロパティを使用
            workspaceCode,
            request);

        return TypedResults.Created(
            $"/api/external/workspaces/{workspaceCode}/items/{result.ItemNumber}",
            result);
    }
}