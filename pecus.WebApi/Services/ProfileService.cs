using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Responses.User;

namespace Pecus.Services;

/// <summary>
/// プロフィール関連のサービス
/// </summary>
public class ProfileService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProfileService> _logger;
    private readonly RefreshTokenService _refreshTokenService;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ProfileService(
        ApplicationDbContext context,
        ILogger<ProfileService> logger,
        RefreshTokenService refreshTokenService
    )
    {
        _context = context;
        _logger = logger;
        _refreshTokenService = refreshTokenService;
    }

    /// <summary>
    /// メールアドレスを変更
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="newEmail">新しいメールアドレス</param>
    /// <returns>成功した場合はtrue、失敗した場合はfalse</returns>
    public async Task<bool> UpdateEmailAsync(int userId, string newEmail)
    {
        // 新しいメールアドレスが既に使用されていないかチェック
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == newEmail);
        if (existingUser != null)
        {
            _logger.LogWarning("メールアドレス変更失敗: 既に使用されているメールアドレスです。UserId: {UserId}, NewEmail: {NewEmail}", userId, newEmail);
            return false;
        }

        // ユーザー取得
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("メールアドレス変更失敗: ユーザーが見つかりません。UserId: {UserId}", userId);
            return false;
        }

        // DB更新
        user.Email = newEmail;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = userId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException<User>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                user
            );
        }

        _logger.LogInformation("メールアドレスを変更しました。UserId: {UserId}, NewEmail: {NewEmail}", userId, newEmail);
        return true;
    }

    /// <summary>
    /// ユーザーの有効なデバイス情報の一覧を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>デバイス情報の一覧</returns>
    public async Task<List<DeviceResponse>> GetUserDevicesAsync(int userId)
    {
        var devices = await _context.Devices
            .Where(d => d.UserId == userId && !d.IsRevoked)
            .Include(d => d.RefreshTokens)
            .OrderByDescending(d => d.LastSeenAt)
            .ToListAsync();

        var response = devices.Select(d => new DeviceResponse
        {
            Id = d.Id,
            PublicId = d.PublicId,
            Name = d.Name,
            DeviceType = d.DeviceType.ToString(),
            OS = d.OS.ToString(),
            Client = d.Client,
            AppVersion = d.AppVersion,
            FirstSeenAt = d.FirstSeenAt,
            LastSeenAt = d.LastSeenAt,
            LastIpMasked = d.LastIpMasked,
            LastSeenLocation = d.LastSeenLocation,
            Timezone = d.Timezone,
            RefreshTokenCount = d.RefreshTokens.Count(rt => !rt.IsRevoked),
            IsRevoked = d.IsRevoked,
        }).ToList();

        return response;
    }

    /// <summary>
    /// ユーザーのデバイスを削除（関連するリフレッシュトークンも削除）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="deviceId">デバイスID</param>
    /// <returns>削除に成功した場合はtrue、デバイスが見つからない場合はfalse</returns>
    public async Task<bool> DeleteUserDeviceAsync(int userId, int deviceId)
    {
        // デバイスを取得（ユーザー所有確認）
        var device = await _context.Devices
            .Include(d => d.RefreshTokens)
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.UserId == userId);

        if (device == null)
        {
            _logger.LogWarning("デバイス削除失敗: デバイスが見つからないか、アクセス権限がありません。UserId: {UserId}, DeviceId: {DeviceId}", userId, deviceId);
            return false;
        }

        // 関連するリフレッシュトークンを無効化
        if (device.RefreshTokens.Any())
        {
            foreach (var refreshToken in device.RefreshTokens.Where(rt => !rt.IsRevoked))
            {
                await _refreshTokenService.RevokeRefreshTokenAsync(refreshToken.Token);
            }
            _logger.LogInformation("デバイスに関連するリフレッシュトークンを無効化しました。DeviceId: {DeviceId}, TokenCount: {TokenCount}", deviceId, device.RefreshTokens.Count(rt => !rt.IsRevoked));
        }

        return true;
    }
}