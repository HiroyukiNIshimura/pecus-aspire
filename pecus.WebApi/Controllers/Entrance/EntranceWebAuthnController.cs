using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// パスキー（WebAuthn）認証コントローラー（公開エンドポイント）
/// </summary>
[ApiController]
[Route("api/entrance/webauthn")]
[Produces("application/json")]
[AllowAnonymous]
[Tags("Entrance - WebAuthn")]
public class EntranceWebAuthnController : ControllerBase
{
    private const int RateLimitCount = 20;
    private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(5);

    private readonly WebAuthnCredentialService _credentialService;
    private readonly AuthTokenIssuer _tokenIssuer;
    private readonly LoginRateLimiter _rateLimiter;
    private readonly ILogger<EntranceWebAuthnController> _logger;

    public EntranceWebAuthnController(
        WebAuthnCredentialService credentialService,
        AuthTokenIssuer tokenIssuer,
        LoginRateLimiter rateLimiter,
        ILogger<EntranceWebAuthnController> logger)
    {
        _credentialService = credentialService;
        _tokenIssuer = tokenIssuer;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    /// <summary>
    /// パスキーログイン用のオプションを取得
    /// </summary>
    [HttpPost("login/options")]
    [ProducesResponseType(typeof(WebAuthnLoginOptionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<Ok<WebAuthnLoginOptionsResponse>> GetLoginOptions(
        [FromBody] WebAuthnLoginOptionsRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsAllowedForIdentifierAsync("options", request.LoginIdentifier, cancellationToken))
        {
            throw new TooManyRequestsException("試行回数が上限に達しました。しばらくしてから再度お試しください。");
        }

        var user = await _credentialService.FindUserByIdentifierAsync(
            request.LoginIdentifier,
            cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedException("認証に失敗しました。");
        }

        var (response, _) = await _credentialService.CreateLoginOptionsAsync(user, cancellationToken);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// パスキー認証を検証し、トークンを発行
    /// </summary>
    [HttpPost("login/verify")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<Ok<LoginResponse>> Verify(
        [FromBody] WebAuthnAssertionRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsAllowedForSecretAsync("verify", request.Id, cancellationToken))
        {
            throw new TooManyRequestsException("試行回数が上限に達しました。しばらくしてから再度お試しください。");
        }

        var user = await _credentialService.VerifyLoginAsync(request, cancellationToken);

        var deviceContext = new AuthDeviceContext(
            DeviceName: request.DeviceName,
            DeviceType: request.DeviceType,
            OS: request.OS,
            UserAgent: request.UserAgent ?? HttpContext.Request.Headers["User-Agent"].ToString(),
            AppVersion: request.AppVersion,
            Timezone: request.Timezone,
            Location: request.Location,
            IpAddress: ClientIpResolver.GetClientIpAddress(HttpContext),
            AuthMethod: RefreshTokenService.AuthMethodPasskey);

        var response = await _tokenIssuer.IssueAsync(user, deviceContext);

        _logger.LogInformation(
            "パスキー認証に成功しました。UserId: {UserId}, DeviceId: {DeviceId}",
            user.Id,
            response.Device?.Id);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// セットアップトークン／リカバリートークンからパスキー登録用のオプションを取得
    /// </summary>
    [HttpPost("register/options")]
    [ProducesResponseType(typeof(WebAuthnRegistrationOptionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<Ok<WebAuthnRegistrationOptionsResponse>> GetSetupRegistrationOptions(
        [FromBody] WebAuthnSetupOptionsRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsAllowedForSecretAsync(
                "register-options",
                request.Token ?? request.RecoveryToken ?? string.Empty,
                cancellationToken))
        {
            throw new TooManyRequestsException("試行回数が上限に達しました。しばらくしてから再度お試しください。");
        }

        var response = await _credentialService.CreateSetupRegistrationOptionsAsync(
            request.Token,
            request.RecoveryToken,
            cancellationToken);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// セットアップトークン／リカバリーコードでパスキーを登録
    /// </summary>
    [HttpPost("register/verify")]
    [ProducesResponseType(typeof(WebAuthnSetupRegistrationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<Ok<WebAuthnSetupRegistrationResponse>> VerifySetupRegistration(
        [FromBody] WebAuthnRegistrationRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsAllowedForSecretAsync("register-verify", request.Id, cancellationToken))
        {
            throw new TooManyRequestsException("試行回数が上限に達しました。しばらくしてから再度お試しください。");
        }

        var result = await _credentialService.RegisterWithSetupAsync(request, cancellationToken);

        _logger.LogInformation(
            "パスキーを登録しました（セットアップ経路）。CredentialId: {CredentialId}, SessionsRevoked: {SessionsRevoked}",
            result.Credential.Id,
            result.SessionsRevoked);

        return TypedResults.Ok(new WebAuthnSetupRegistrationResponse
        {
            Credential = result.Credential,
            RecoveryCodes = result.RecoveryCodes,
            RecoveryCodeInstruction = result.RecoveryCodeInstruction,
            SessionsRevoked = result.SessionsRevoked,
            UnusedRecoveryCodeCount = result.UnusedRecoveryCodeCount,
        });
    }

    /// <summary>
    /// ログイン識別子などの短いキーで制限する（大文字小文字を正規化する）
    /// </summary>
    private async Task<bool> IsAllowedForIdentifierAsync(
        string action,
        string identifier,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await _rateLimiter.IsAllowedAsync(
            $"{action}:{identifier.Trim().ToLowerInvariant()}",
            RateLimitCount,
            RateLimitWindow);
    }

    /// <summary>
    /// クレデンシャルIDやトークンなどの長いキーで制限する（ハッシュ化して使う）
    /// </summary>
    private async Task<bool> IsAllowedForSecretAsync(
        string action,
        string value,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await _rateLimiter.IsAllowedAsync(
            $"{action}:{LoginRateLimiter.HashKey(value.Trim())}",
            RateLimitCount,
            RateLimitWindow);
    }
}
