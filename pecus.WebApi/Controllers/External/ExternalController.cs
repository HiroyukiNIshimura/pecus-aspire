using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Authentication;
using Pecus.Models.Requests.External;

namespace Pecus.Controllers.External;

/// <summary>
/// 外部公開APIコントローラー（APIキー認証）
/// </summary>
/// <remarks>
/// X-API-KEY ヘッダーによるAPIキー認証が必要です。
/// 組織スコープで動作し、認証されたキーの所属組織のデータのみアクセス可能です。
/// </remarks>
[ApiController]
[Route("api/external")]
[Authorize(AuthenticationSchemes = ApiKeyAuthenticationOptions.SchemeName)]
[Produces("application/json")]
[Tags("External API")]
public class ExternalController : ControllerBase
{
    /// <summary>
    /// 認証済みAPIキーの組織IDを取得
    /// </summary>
    protected int CurrentOrganizationId =>
        int.Parse(User.FindFirst("organization_id")?.Value
            ?? throw new InvalidOperationException("organization_id claim not found"));

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
            OrganizationCode = User.FindFirst("organization_code")?.Value ?? "",
            Timestamp = DateTimeOffset.UtcNow,
        });
    }
}

