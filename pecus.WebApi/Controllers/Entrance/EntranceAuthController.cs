using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Role;
using Pecus.Models.Responses.User;
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
    private readonly RefreshTokenService _refreshService;
    private readonly TokenBlacklistService _blacklistService;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<EntranceAuthController> _logger;

    public EntranceAuthController(UserService userService, RefreshTokenService refreshService, TokenBlacklistService blacklistService, IBackgroundJobClient backgroundJobClient, ILogger<EntranceAuthController> logger)
    {
        _userService = userService;
        _refreshService = refreshService;
        _blacklistService = blacklistService;
        _backgroundJobClient = backgroundJobClient;
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
    /// ログイン
    /// </summary>
    /// <remarks>
    /// EmailまたはLoginIdとパスワードでログインします
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
            throw new InvalidOperationException("認証に失敗しました。メールアドレス（またはログインID）またはパスワードが正しくありません。");
        }

        // JWTトークンを生成
        var token = JwtBearerUtil.GenerateToken(user);
        var expiresAt = JwtBearerUtil.GetTokenExpiration();
        var expiresIn = JwtBearerUtil.GetExpiresMinutes() * 60; // 秒に変換

        // 発行したリフレッシュトークンを作成（rotation 用／保存）
        var deviceInfo = new RefreshTokenService.DeviceInfo(
            DeviceName: request.DeviceName,
            DeviceType: request.DeviceType,
            OS: request.OS,
            UserAgent: request.UserAgent ?? HttpContext.Request.Headers["User-Agent"].ToString(),
            AppVersion: request.AppVersion,
            Timezone: request.Timezone,
            LastSeenLocation: request.Location,
            IpAddress: request.IpAddress ?? GetClientIpAddress()
        );
        var refreshToken = await _refreshService.CreateRefreshTokenAsync(user.Id, deviceInfo);

        // 発行したアクセストークンの JTI をユーザーのトークン一覧に登録（追跡）
        var jti = JwtBearerUtil.GetJtiFromToken(token);
        if (!string.IsNullOrWhiteSpace(jti))
        {
            await _blacklistService.RegisterUserJtiAsync(user.Id, jti);
        }

        var response = new LoginResponse
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresAt = expiresAt,
            ExpiresIn = expiresIn,
            UserId = user.Id,
            LoginId = user.LoginId,
            Username = user.Username,
            Email = user.Email,
            AvatarType = user.AvatarType,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: user.AvatarType,
                organizationId: user.OrganizationId,
                userId: user.Id,
                username: user.Username,
                email: user.Email,
                avatarPath: user.UserAvatarPath
            ),
            Roles = user
                .Roles.Select(r => new RoleInfoResponse { Id = r.Id, Name = r.Name })
                .ToList(),
            RefreshToken = refreshToken.Token,
            RefreshExpiresAt = refreshToken.ExpiresAt,
        };

        if (refreshToken.ChangeDevice)
        {
            _logger.LogInformation(
                "新しいデバイスが作成されました。UserId: {UserId}, DeviceName: {DeviceName}, DeviceType: {DeviceType}, IP: {IpAddress}",
                user.Id,
                deviceInfo.DeviceName,
                deviceInfo.DeviceType,
                deviceInfo.IpAddress
            );

            // バックグラウンドでメール送信
            var securitySettingsUrl = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host}/settings/security";

            var model = new SecurityNotificationEmailModel
            {
                UserName = user.Username,
                Email = user.Email,
                DeviceName = deviceInfo.DeviceName ?? "不明なデバイス",
                DeviceType = deviceInfo.DeviceType.ToString(),
                OS = deviceInfo.OS.ToString(),
                IpAddress = deviceInfo.IpAddress,
                Timezone = deviceInfo.Timezone,
                LoginAt = DateTime.UtcNow,
                SecuritySettingsUrl = securitySettingsUrl
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    user.Email,
                    "セキュリティ通知: 新しいデバイスからのログインを検知しました",
                    "security-notification",
                    model
                )
            );

            _logger.LogInformation(
                "セキュリティ通知メールをHangfireジョブキューに投入しました。UserId: {UserId}, Email: {Email}",
                user.Id,
                user.Email
            );
        }

        return TypedResults.Ok(response);
    }
}
