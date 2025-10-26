using Pecus.Libs;
using Pecus.Services;

namespace Pecus.Middleware;

/// <summary>
/// JWTトークンのブラックリストチェックを行うミドルウェア
/// </summary>
public class TokenValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TokenValidationMiddleware> _logger;

    public TokenValidationMiddleware(
        RequestDelegate next,
        ILogger<TokenValidationMiddleware> logger
    )
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, TokenBlacklistService blacklistService)
    {
        // 認証されたユーザーのみチェック
        if (context.User.Identity?.IsAuthenticated == true)
        {
            try
            {
                var jti = JwtBearerUtil.GetJtiFromPrincipal(context.User);
                var userId = JwtBearerUtil.GetUserIdFromPrincipal(context.User);
                var issuedAt = JwtBearerUtil.GetIssuedAtFromPrincipal(context.User);

                // JTIによるブラックリストチェック
                if (!string.IsNullOrEmpty(jti))
                {
                    var isBlacklisted = await blacklistService.IsTokenBlacklistedAsync(jti);
                    if (isBlacklisted)
                    {
                        _logger.LogWarning(
                            "ブラックリストに登録されたトークンでアクセスが試行されました。JTI: {Jti}, UserId: {UserId}",
                            jti,
                            userId
                        );
                        context.Response.StatusCode = 401;
                        await context.Response.WriteAsync("Token has been revoked");
                        return;
                    }
                }

                // ユーザー単位の無効化チェック（パスワード変更時など）
                if (issuedAt > 0)
                {
                    var isUserTokenInvalidated = await blacklistService.IsUserTokenInvalidatedAsync(
                        userId,
                        issuedAt,
                        jti
                    );
                    if (isUserTokenInvalidated)
                    {
                        _logger.LogWarning(
                            "無効化されたユーザートークンでアクセスが試行されました。UserId: {UserId}, IssuedAt: {IssuedAt}",
                            userId,
                            issuedAt
                        );
                        context.Response.StatusCode = 401;
                        await context.Response.WriteAsync("Token has been invalidated");
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "トークン検証中にエラーが発生しました");
                // エラーが発生した場合は処理を続行
            }
        }

        await _next(context);
    }
}
