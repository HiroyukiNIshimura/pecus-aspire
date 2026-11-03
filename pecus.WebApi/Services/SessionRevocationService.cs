using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;

namespace Pecus.Services;

/// <summary>
/// ユーザー／組織単位でセッション（デバイス・リフレッシュトークン・JWT）を失効させる
/// </summary>
public class SessionRevocationService
{
    private readonly ApplicationDbContext _context;
    private readonly RefreshTokenService _refreshTokens;
    private readonly TokenBlacklistService _blacklist;
    private readonly ILogger<SessionRevocationService> _logger;

    public SessionRevocationService(
        ApplicationDbContext context,
        RefreshTokenService refreshTokens,
        TokenBlacklistService blacklist,
        ILogger<SessionRevocationService> logger)
    {
        _context = context;
        _refreshTokens = refreshTokens;
        _blacklist = blacklist;
        _logger = logger;
    }

    /// <summary>
    /// 全デバイスとセッション（リフレッシュトークン・JWT）を失効させる
    /// </summary>
    public async Task RevokeAllSessionsAsync(int userId, CancellationToken cancellationToken = default)
    {
        await _context
            .Devices
            .Where(d => d.UserId == userId && !d.IsRevoked)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(d => d.IsRevoked, true),
                cancellationToken);

        await _refreshTokens.RevokeAllUserRefreshTokensAsync(userId);
        await _blacklist.BlacklistAllUserTokensAsync(userId);

        _logger.LogInformation("全セッションを失効しました。UserId: {UserId}", userId);
    }

    /// <summary>
    /// 組織に所属する有効ユーザーの全セッションを失効させる
    /// </summary>
    /// <remarks>
    /// 認証方式をパスキー専用へ変更した際に使用する。パスワードで確立済みのセッションは
    /// リフレッシュで延命されるため、失効させないと方式変更が既存セッションに作用しない。
    /// </remarks>
    public async Task RevokeOrganizationSessionsAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        var userIds = await _context
            .Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        foreach (var userId in userIds)
        {
            await RevokeAllSessionsAsync(userId, cancellationToken);
        }

        _logger.LogInformation(
            "組織の全セッションを失効しました。OrganizationId: {OrganizationId}, UserCount: {UserCount}",
            organizationId,
            userIds.Count);
    }
}
