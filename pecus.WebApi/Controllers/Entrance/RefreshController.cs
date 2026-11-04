using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// リフレッシュトークンコントローラー（公開エンドポイント）
/// </summary>
[ApiController]
[Route("api/entrance")]
[Produces("application/json")]
[Tags("Entrance - Auth")]
public class RefreshController : ControllerBase
{
    private readonly RefreshTokenService _refreshService;
    private readonly UserService _userService;
    private readonly OrganizationAuthPolicyService _authPolicy;
    private readonly ILogger<RefreshController> _logger;

    public RefreshController(
        RefreshTokenService refreshService,
        UserService userService,
        OrganizationAuthPolicyService authPolicy,
        ILogger<RefreshController> logger)
    {
        _refreshService = refreshService;
        _userService = userService;
        _authPolicy = authPolicy;
        _logger = logger;
    }

    /// <summary>
    /// クライアントのIPアドレスを取得します
    /// </summary>
    private string? GetClientIpAddress()
    {
        // X-Forwarded-For ヘッダーをチェック（プロキシ経由の場合）
        var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            // カンマ区切りで複数のIPが含まれる場合があるので、最初のものを取得
            return forwardedFor.Split(',').First().Trim();
        }

        // X-Real-IP ヘッダーをチェック（Nginxなどのプロキシ）
        var realIp = HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp))
        {
            return realIp;
        }

        // RemoteIpAddress を取得
        return HttpContext.Connection.RemoteIpAddress?.ToString();
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
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<RefreshResponse>> Refresh([FromBody] RefreshRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new UnauthorizedException("RefreshToken is required");
        }

        // リフレッシュトークンは RefreshTokenService が Guid("N") 形式（32桁の16進数）で発行する。
        // 形式が一致しない値は有効なトークンになり得ないため、ストア照会や認証方式ポリシー判定の前に拒否する。
        if (!Guid.TryParseExact(request.RefreshToken, "N", out _))
        {
            throw new UnauthorizedException("Invalid refresh token");
        }

        var info = await _refreshService.ValidateRefreshTokenAsync(request.RefreshToken);
        if (info == null)
        {
            throw new UnauthorizedException("Invalid refresh token");
        }

        var user = await _userService.GetUserByIdAsync(info.UserId);
        if (user == null)
        {
            throw new UnauthorizedException("Invalid refresh token");
        }

        // 発行元の認証方式が組織のポリシーで禁止されたら、そのセッションは延命しない。
        // 切替時のセッション失効が失敗しても、遅くともアクセストークンの有効期限後に遮断するため。
        var mode = await _authPolicy.GetModeByUserIdAsync(user.Id);
        var authMethodAllowed = info.AuthMethod switch
        {
            RefreshTokenService.AuthMethodPassword => OrganizationAuthPolicyService.AllowsPassword(mode),
            RefreshTokenService.AuthMethodPasskey => OrganizationAuthPolicyService.AllowsWebAuthn(mode),
            // 発行元が不明なトークン（旧トークン・Redis 復元時）は、
            // 両方の方式を許可している組織でのみ許可する（安全側に倒す）
            _ => OrganizationAuthPolicyService.AllowsPassword(mode)
                && OrganizationAuthPolicyService.AllowsWebAuthn(mode),
        };

        if (!authMethodAllowed)
        {
            await _refreshService.RevokeRefreshTokenAsync(request.RefreshToken);
            throw new UnauthorizedException("認証方式が変更されました。再度ログインしてください。");
        }

        // ローテーション: 古いリフレッシュトークンを無効化して新しいものを発行
        await _refreshService.RevokeRefreshTokenAsync(request.RefreshToken);
        var deviceInfo = new RefreshTokenService.DeviceInfo(
            DeviceName: request.DeviceName,
            DeviceType: request.DeviceType ?? DeviceType.Browser,
            OS: request.OS ?? OSPlatform.Unknown,
            UserAgent: request.UserAgent ?? HttpContext.Request.Headers["User-Agent"].ToString(),
            AppVersion: request.AppVersion,
            Timezone: request.Timezone,
            LastSeenLocation: request.Location,
            IpAddress: request.IpAddress ?? GetClientIpAddress()
        );
        // 認証方式はローテーション後も引き継ぐ
        var newRefresh = await _refreshService.CreateRefreshTokenAsync(
            user.Id,
            deviceInfo,
            info.AuthMethod);

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
    public async Task<NoContent> Logout([FromBody] RefreshRequest request)
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
}