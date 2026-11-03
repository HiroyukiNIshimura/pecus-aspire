using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// パスキー紛失時のリカバリーコントローラー（公開エンドポイント）
/// </summary>
[ApiController]
[Route("api/entrance/recovery")]
[Produces("application/json")]
[AllowAnonymous]
[Tags("Entrance - Recovery")]
public class EntranceRecoveryController : ControllerBase
{
    private const int RateLimitCount = 5;
    private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(15);

    private readonly WebAuthnCredentialService _credentialService;
    private readonly LoginRateLimiter _rateLimiter;
    private readonly ILogger<EntranceRecoveryController> _logger;

    public EntranceRecoveryController(
        WebAuthnCredentialService credentialService,
        LoginRateLimiter rateLimiter,
        ILogger<EntranceRecoveryController> logger)
    {
        _credentialService = credentialService;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    /// <summary>
    /// リカバリーコードを検証し、パスキー再登録用トークンを発行
    /// </summary>
    /// <remarks>
    /// 識別子やコードが一致しない場合も、ユーザー存在の推測を避けるため汎用エラーを返す。
    /// </remarks>
    [HttpPost("code")]
    [ProducesResponseType(typeof(WebAuthnRecoveryTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<Ok<WebAuthnRecoveryTokenResponse>> VerifyCode(
        [FromBody] WebAuthnRecoveryCodeRequest request,
        CancellationToken cancellationToken)
    {
        var clientIp = ClientIpResolver.GetClientIpAddress(HttpContext) ?? "unknown";
        var allowed = await _rateLimiter.IsAllowedAsync(
            $"recovery:{request.LoginIdentifier.Trim().ToLowerInvariant()}:{clientIp}",
            RateLimitCount,
            RateLimitWindow);

        if (!allowed)
        {
            throw new TooManyRequestsException("試行回数が上限に達しました。しばらくしてから再度お試しください。");
        }

        var recoveryToken = await _credentialService.CreateRecoveryTokenAsync(
            request.LoginIdentifier,
            request.Code,
            cancellationToken);

        if (recoveryToken is null)
        {
            _logger.LogWarning("リカバリーコードの検証に失敗しました。");
            throw new UnauthorizedException("リカバリーコードが正しくないか、有効期限が切れています。");
        }

        _logger.LogInformation("リカバリーコードを検証しました。");

        return TypedResults.Ok(new WebAuthnRecoveryTokenResponse
        {
            RecoveryToken = recoveryToken,
            ExpiresAt = DateTimeOffset.UtcNow.Add(WebAuthnCredentialService.SetupTokenTtl),
        });
    }
}
