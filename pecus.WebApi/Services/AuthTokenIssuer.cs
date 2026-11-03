using Hangfire;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;
using Pecus.Models.Responses.User;

namespace Pecus.Services;

/// <summary>
/// ログイン時のデバイス情報
/// </summary>
public record AuthDeviceContext(
    string? DeviceName,
    DeviceType DeviceType,
    OSPlatform OS,
    string? UserAgent,
    string? AppVersion,
    string? Timezone,
    string? Location,
    string? IpAddress);

/// <summary>
/// 認証成功後に JWT・リフレッシュトークン・デバイスを発行する
/// </summary>
/// <remarks>
/// パスワード認証とパスキー認証で共通利用する。
/// 認証方式が増えてもトークン発行・新デバイス通知の実装が分散しないようにする。
/// </remarks>
public class AuthTokenIssuer
{
    private readonly RefreshTokenService _refreshService;
    private readonly TokenBlacklistService _blacklistService;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly FrontendUrlResolver _frontendUrlResolver;
    private readonly ILogger<AuthTokenIssuer> _logger;

    public AuthTokenIssuer(
        RefreshTokenService refreshService,
        TokenBlacklistService blacklistService,
        IBackgroundJobClient backgroundJobClient,
        FrontendUrlResolver frontendUrlResolver,
        ILogger<AuthTokenIssuer> logger)
    {
        _refreshService = refreshService;
        _blacklistService = blacklistService;
        _backgroundJobClient = backgroundJobClient;
        _frontendUrlResolver = frontendUrlResolver;
        _logger = logger;
    }

    /// <summary>
    /// 認証済みユーザーに対してトークンを発行し、ログインレスポンスを返す
    /// </summary>
    public async Task<LoginResponse> IssueAsync(User user, AuthDeviceContext deviceContext)
    {
        var token = JwtBearerUtil.GenerateToken(user);
        var expiresAt = JwtBearerUtil.GetTokenExpiration();
        var expiresIn = JwtBearerUtil.GetExpiresMinutes() * 60;

        var deviceInfo = new RefreshTokenService.DeviceInfo(
            DeviceName: deviceContext.DeviceName,
            DeviceType: deviceContext.DeviceType,
            OS: deviceContext.OS,
            UserAgent: deviceContext.UserAgent,
            AppVersion: deviceContext.AppVersion,
            Timezone: deviceContext.Timezone,
            LastSeenLocation: deviceContext.Location,
            IpAddress: deviceContext.IpAddress
        );
        var refreshToken = await _refreshService.CreateRefreshTokenAsync(user.Id, deviceInfo);

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
            Device = new LoginDeviceInfo
            {
                Id = refreshToken.DeviceId,
                PublicId = refreshToken.DevicePublicId,
                IsNewDevice = refreshToken.ChangeDevice
            },
            LandingPage = user.Setting?.LandingPage
        };

        if (refreshToken.ChangeDevice)
        {
            NotifyNewDevice(user, deviceInfo);
        }

        return response;
    }

    private void NotifyNewDevice(User user, RefreshTokenService.DeviceInfo deviceInfo)
    {
        _logger.LogInformation(
            "新しいデバイスが作成されました。UserId: {UserId}, DeviceName: {DeviceName}, DeviceType: {DeviceType}, IP: {IpAddress}",
            user.Id,
            deviceInfo.DeviceName?.ReplaceLineEndings(string.Empty),
            deviceInfo.DeviceType,
            deviceInfo.IpAddress?.ReplaceLineEndings(string.Empty)
        );

        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
        var securitySettingsUrl = $"{baseUrl}/profile?t=devices";

        var model = new SecurityNotificationEmailModel
        {
            UserName = user.Username,
            Email = user.Email,
            DeviceName = deviceInfo.DeviceName ?? "不明なデバイス",
            DeviceType = deviceInfo.DeviceType.ToString(),
            OS = deviceInfo.OS.ToString(),
            IpAddress = deviceInfo.IpAddress != null
                ? RefreshTokenService.MaskIpAddress(deviceInfo.IpAddress)
                : "不明",
            Timezone = deviceInfo.Timezone,
            LoginAt = DateTime.UtcNow,
            SecuritySettingsUrl = securitySettingsUrl
        };

        _backgroundJobClient.Enqueue<EmailTasks>(x =>
            x.SendTemplatedEmailAsync(
                user.OrganizationId ?? 0,
                user.Email,
                "セキュリティ通知: 新しいデバイスからのログインを検知しました",
                model
            )
        );

        _logger.LogInformation(
            "セキュリティ通知メールをHangfireジョブキューに投入しました。UserId: {UserId}, Email: {Email}",
            user.Id,
            user.Email.ReplaceLineEndings(string.Empty)
        );
    }
}
