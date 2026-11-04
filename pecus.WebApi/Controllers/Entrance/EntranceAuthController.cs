using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// 認証コントローラー（公開エンドポイント）
/// </summary>
[ApiController]
[Route("api/entrance/auth")]
[Produces("application/json")]
[AllowAnonymous]
[Tags("Entrance - Auth")]
public class EntranceAuthController : ControllerBase
{
    private readonly UserService _userService;
    private readonly AuthTokenIssuer _tokenIssuer;
    private readonly ILogger<EntranceAuthController> _logger;

    public EntranceAuthController(
        UserService userService,
        AuthTokenIssuer tokenIssuer,
        ILogger<EntranceAuthController> logger)
    {
        _userService = userService;
        _tokenIssuer = tokenIssuer;
        _logger = logger;
    }

    /// <summary>
    /// ログイン
    /// </summary>
    /// <remarks>
    /// EmailまたはLoginIdとパスワードでログインします。
    /// 組織がパスキー専用に設定されている場合は失敗します。
    /// </remarks>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userService.AuthenticateAsync(request);
        if (user == null)
        {
            _logger.LogWarning("パスワード認証に失敗しました。");
            throw new InvalidOperationException("認証に失敗しました。メールアドレス（またはログインID）またはパスワードが正しくありません。");
        }

        var deviceContext = new AuthDeviceContext(
            DeviceName: request.DeviceName,
            DeviceType: request.DeviceType,
            OS: request.OS,
            UserAgent: request.UserAgent ?? HttpContext.Request.Headers["User-Agent"].ToString(),
            AppVersion: request.AppVersion,
            Timezone: request.Timezone,
            Location: request.Location,
            IpAddress: request.IpAddress ?? ClientIpResolver.GetClientIpAddress(HttpContext),
            AuthMethod: RefreshTokenService.AuthMethodPassword);

        var response = await _tokenIssuer.IssueAsync(user, deviceContext);

        return TypedResults.Ok(response);
    }
}
