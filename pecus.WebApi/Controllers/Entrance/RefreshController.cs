using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

[ApiController]
[Route("api/entrance")]
[Produces("application/json")]
public class RefreshController : ControllerBase
{
    private readonly RefreshTokenService _refreshService;
    private readonly UserService _userService;
    private readonly ILogger<RefreshController> _logger;

    public RefreshController(RefreshTokenService refreshService, UserService userService, ILogger<RefreshController> logger)
    {
        _refreshService = refreshService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// リフレッシュトークンによるアクセストークン再発行
    /// </summary>
    /// <remarks>
    /// 有効なリフレッシュトークンを使用して、新しいアクセストークンとリフレッシュトークンを取得します。
    /// </remarks>
    /// <param name="request">リフレッシュトークン情報</param>
    /// <returns>新しいアクセストークンとリフレッシュトークン</returns>
    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(RefreshResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<RefreshResponse>, BadRequest<ErrorResponse>, StatusCodeHttpResult>
    > Refresh([FromBody] RefreshRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return TypedResults.BadRequest(new ErrorResponse { Message = "RefreshToken is required" });
            }

            var info = await _refreshService.ValidateRefreshTokenAsync(request.RefreshToken);
            if (info == null)
            {
                return TypedResults.BadRequest(new ErrorResponse { Message = "Invalid refresh token" });
            }

            var user = await _userService.GetUserByIdAsync(info.UserId);
            if (user == null) return TypedResults.BadRequest(new ErrorResponse { Message = "Invalid refresh token" });

            // ローテーション: 古いリフレッシュトークンを無効化して新しいものを発行
            await _refreshService.RevokeRefreshTokenAsync(request.RefreshToken);
            var newRefresh = await _refreshService.CreateRefreshTokenAsync(user.Id);

            var accessToken = JwtBearerUtil.GenerateToken(user);
            var expiresAt = JwtBearerUtil.GetTokenExpiration();
            var expiresIn = JwtBearerUtil.GetExpiresMinutes() * 60;

            // 発行したアクセストークンの JTI をユーザーのトークン一覧に登録（追跡）
            var jti = JwtBearerUtil.GetJtiFromToken(accessToken);
            if (!string.IsNullOrWhiteSpace(jti))
            {
                var blacklistSvc = HttpContext.RequestServices.GetRequiredService<TokenBlacklistService>();
                await blacklistSvc.RegisterUserJtiAsync(user.Id, jti);
            }

            var response = new RefreshResponse
            {
                AccessToken = accessToken,
                TokenType = "Bearer",
                ExpiresAt = expiresAt,
                ExpiresIn = expiresIn,
                RefreshToken = newRefresh.Token,
                RefreshExpiresAt = newRefresh.ExpiresAt
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Refresh token error");
            return TypedResults.StatusCode(500);
        }
    }

    /// <summary>
    /// ログアウト（トークン無効化）
    /// </summary>
    /// <remarks>
    /// 現在のアクセストークンとリフレッシュトークンを無効化します。
    /// </remarks>
    /// <param name="request">リフレッシュトークン情報</param>
    /// <returns>ログアウト結果</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<NoContent, StatusCodeHttpResult>
    > Logout([FromBody] RefreshRequest request)
    {
        try
        {
            // 現在のアクセストークンの JTI をブラックリスト化
            var jti = JwtBearerUtil.GetJtiFromPrincipal(User);
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ブラックリスト登録
            var expiresAt = JwtBearerUtil.GetTokenExpirationFromPrincipal(User);
            // TokenBlacklistService は循環依存を避けるため、コンストラクタ注入ではなくメソッド内で動的に解決
            var blacklist = HttpContext.RequestServices.GetRequiredService<TokenBlacklistService>();
            await blacklist.BlacklistTokenAsync(jti, expiresAt);

            // リフレッシュトークンの無効化
            if (!string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                await _refreshService.RevokeRefreshTokenAsync(request.RefreshToken);
            }

            // 全セッションを切る場合は以下を利用
            // await _refreshService.RevokeAllUserRefreshTokensAsync(me);

            return TypedResults.NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Logout error");
            return TypedResults.StatusCode(500);
        }
    }
}
