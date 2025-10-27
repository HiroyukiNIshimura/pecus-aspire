using Microsoft.AspNetCore.Authorization;
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

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(new ErrorResponse { Message = "RefreshToken is required" });
            }

            var info = await _refreshService.ValidateRefreshTokenAsync(request.RefreshToken);
            if (info == null)
            {
                return BadRequest(new ErrorResponse { Message = "Invalid refresh token" });
            }

            var user = await _userService.GetUserByIdAsync(info.UserId);
            if (user == null) return BadRequest(new ErrorResponse { Message = "Invalid refresh token" });

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

            return Ok(new
            {
                AccessToken = accessToken,
                TokenType = "Bearer",
                ExpiresAt = expiresAt,
                ExpiresIn = expiresIn,
                RefreshToken = newRefresh.Token,
                RefreshExpiresAt = newRefresh.ExpiresAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Refresh token error");
            return StatusCode(500);
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
    {
        try
        {
            // 現在のアクセストークンの JTI をブラックリスト化
            var jti = JwtBearerUtil.GetJtiFromPrincipal(User);
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ブラックリスト登録
            var expiresAt = JwtBearerUtil.GetTokenExpirationFromPrincipal(User);
            // TokenBlacklistService は DI で取得
            var blacklist = HttpContext.RequestServices.GetRequiredService<TokenBlacklistService>();
            await blacklist.BlacklistTokenAsync(jti, expiresAt);

            // リフレッシュトークンの無効化
            if (!string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                await _refreshService.RevokeRefreshTokenAsync(request.RefreshToken);
            }

            // 全セッションを切る場合は以下を利用
            // await _refreshService.RevokeAllUserRefreshTokensAsync(me);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Logout error");
            return StatusCode(500);
        }
    }
}
