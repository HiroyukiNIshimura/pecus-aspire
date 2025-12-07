using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using StackExchange.Redis;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Pecus.Services;

/// <summary>
/// Redis + PostgreSQL を利用するリフレッシュトークン管理サービス（ハイブリッド方式）
/// </summary>
public class RefreshTokenService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;
    private readonly ApplicationDbContext _context;

    // TTL for refresh tokens (days)
    private readonly TimeSpan _refreshTokenTtl = TimeSpan.FromDays(30);
    // 最大同時発行トークン数（ユーザーあたり）
    private const int _maxTokensPerUser = 5;

    public RefreshTokenService(IConnectionMultiplexer redis, ApplicationDbContext context)
    {
        _redis = redis;
        _db = _redis.GetDatabase();
        _context = context;
    }

    public record RefreshTokenInfo(string Token, int UserId, DateTimeOffset ExpiresAt, bool ChangeDevice = false);

    /// <summary>
    /// デバイス作成情報
    /// </summary>
    public record DeviceInfo(
        string? DeviceName,
        DeviceType DeviceType,
        OSPlatform OS,
        string? UserAgent,
        string? AppVersion,
        string? Timezone,
        string? LastSeenLocation,
        string? IpAddress
    );

    /// <summary>
    /// リフレッシュトークンを作成します。
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="deviceInfo">デバイス情報（nullの場合はデバイス作成をスキップ）</param>
    /// <returns></returns>
    public async Task<RefreshTokenInfo> CreateRefreshTokenAsync(int userId, DeviceInfo deviceInfo)
    {
        var token = Guid.NewGuid().ToString("N");
        var expiresAt = DateTime.UtcNow.Add(_refreshTokenTtl);
        var info = new RefreshTokenInfo(token, userId, expiresAt);

        // 1. Redis にキャッシュ（高速アクセス用）
        var key = GetKey(token);
        var payload = JsonSerializer.Serialize(info);
        await _db.StringSetAsync(key, payload, expiresAt - DateTime.UtcNow);

        // track per-user tokens with a Redis set
        var userKey = GetUserKey(userId);
        await _db.SetAddAsync(userKey, token);
        await _db.KeyExpireAsync(userKey, TimeSpan.FromDays(31));

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 2. PostgreSQL に永続化（監査・復旧用）
            var dbToken = new RefreshToken
            {
                Token = token,
                UserId = userId,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false
            };
            _context.RefreshTokens.Add(dbToken);
            await _context.SaveChangesAsync();

            var changeDevice = await CreateDeviceAsync(userId, deviceInfo, dbToken);
            if (changeDevice)
            {
                info = info with { ChangeDevice = true };
            }

            // --- 1ユーザーあたりの有効トークン数制限: 古いトークンを失効させる ---
            var activeTokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId && !t.IsRevoked && t.ExpiresAt > DateTime.UtcNow)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();

            if (activeTokens.Count > _maxTokensPerUser)
            {
                var excess = activeTokens.Count - _maxTokensPerUser;
                var toRevoke = activeTokens.Take(excess).ToList();

                foreach (var old in toRevoke)
                {
                    old.IsRevoked = true;

                    // Redis 側のクリーンアップも行う
                    try
                    {
                        await _db.KeyDeleteAsync(GetKey(old.Token));
                        await _db.SetRemoveAsync(GetUserKey(userId), old.Token);
                    }
                    catch { /* Redis 削除に失敗しても DB 側は更新済み */ }
                }

                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return info;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// リフレッシュトークンを検証します。
    /// </summary>
    /// <param name="token"></param>
    /// <returns></returns>
    public async Task<RefreshTokenInfo?> ValidateRefreshTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;

        // 1. Redis から検証（高速）
        var key = GetKey(token);
        var payload = await _db.StringGetAsync(key);

        if (!payload.IsNullOrEmpty)
        {
            try
            {
                var info = JsonSerializer.Deserialize<RefreshTokenInfo>(payload.ToString());
                if (info != null && info.ExpiresAt > DateTime.UtcNow)
                {
                    return info;
                }
            }
            catch { }
        }

        // 2. Redis にない場合は DB から復元（再起動後など）
        var dbToken = await _context.RefreshTokens
            .Where(t => t.Token == token && !t.IsRevoked && t.ExpiresAt > DateTimeOffset.UtcNow)
            .FirstOrDefaultAsync();

        if (dbToken == null) return null;

        // Redis に再キャッシュ
        var restored = new RefreshTokenInfo(dbToken.Token, dbToken.UserId, dbToken.ExpiresAt);
        var restoredPayload = JsonSerializer.Serialize(restored);
        await _db.StringSetAsync(key, restoredPayload, dbToken.ExpiresAt - DateTimeOffset.UtcNow);

        // ユーザーキーも復元
        var userKey = GetUserKey(dbToken.UserId);
        await _db.SetAddAsync(userKey, token);
        await _db.KeyExpireAsync(userKey, TimeSpan.FromDays(31));

        return restored;
    }

    /// <summary>
    /// リフレッシュトークンを無効化します。
    /// </summary>
    /// <param name="token"></param>
    /// <returns></returns>
    public async Task RevokeRefreshTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return;

        // 1. Redis から削除
        var key = GetKey(token);
        var payload = await _db.StringGetAsync(key);
        if (!payload.IsNullOrEmpty)
        {
            try
            {
                var info = JsonSerializer.Deserialize<RefreshTokenInfo>(payload.ToString());
                if (info != null)
                {
                    var userKey = GetUserKey(info.UserId);
                    await _db.SetRemoveAsync(userKey, token);
                }
            }
            catch { }
        }

        await _db.KeyDeleteAsync(key);

        // 2. DB でも無効化フラグを立てる（監査用）
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var dbToken = await _context.RefreshTokens
                .Include(t => t.Device) // 関連するDeviceをロード
                .Where(t => t.Token == token)
                .FirstOrDefaultAsync();

            if (dbToken != null)
            {
                dbToken.IsRevoked = true;

                // 3. このトークンが関連付けられているDeviceも無効化
                if (dbToken.Device != null && !dbToken.Device.IsRevoked)
                {
                    dbToken.Device.IsRevoked = true;
                    dbToken.Device.LastSeenAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// ユーザーの全リフレッシュトークンを無効化します。
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task RevokeAllUserRefreshTokensAsync(int userId)
    {
        // 1. Redis からユーザーの全トークンを削除
        var userKey = GetUserKey(userId);
        var members = await _db.SetMembersAsync(userKey);
        foreach (var m in members)
        {
            if (m.IsNullOrEmpty) continue;
            var token = m.ToString();
            if (string.IsNullOrWhiteSpace(token)) continue;
            await _db.KeyDeleteAsync(GetKey(token));
        }

        await _db.KeyDeleteAsync(userKey);

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 2. DB でもユーザーの全トークンを無効化（監査用）
            var dbTokens = await _context.RefreshTokens
                .Include(t => t.Device) // 関連するDeviceをロード
                .Where(t => t.UserId == userId && !t.IsRevoked)
                .ToListAsync();

            foreach (var dbToken in dbTokens)
            {
                dbToken.IsRevoked = true;
            }

            // 3. このユーザーの全Deviceも無効化
            var userDevices = dbTokens
                .Where(t => t.Device != null)
                .Select(t => t.Device!)
                .Distinct()
                .Where(d => !d.IsRevoked);

            var now = DateTime.UtcNow;
            foreach (var device in userDevices)
            {
                device.IsRevoked = true;
                device.LastSeenAt = now;
            }

            if (dbTokens.Any() || userDevices.Any())
            {
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static string GetKey(string token) => $"refresh:{token}";
    private static string GetUserKey(int userId) => $"refresh_user:{userId}";

    /// <summary>
    /// IPアドレスをマスクします（例: 192.168.1.100 → 192.168.1.xxx）
    /// </summary>
    private static string? MaskIpAddress(string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(ipAddress)) return null;

        // IPv4の場合
        if (ipAddress.Contains('.'))
        {
            var parts = ipAddress.Split('.');
            if (parts.Length == 4)
            {
                return $"{parts[0]}.{parts[1]}.{parts[2]}.xxx";
            }
        }
        // IPv6の場合（簡易マスク）
        else if (ipAddress.Contains(':'))
        {
            return ipAddress.Substring(0, Math.Min(8, ipAddress.Length)) + ":xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx";
        }

        return ipAddress; // 形式が不明な場合はそのまま
    }

    /// <summary>
    /// デバイス識別子を生成します
    /// </summary>
    private static string GenerateDeviceIdentifier(DeviceInfo deviceInfo)
    {
        // デバイス固有の情報を組み合わせて識別子を生成
        var identifier = $"{deviceInfo.DeviceType}:{deviceInfo.OS}:{deviceInfo.UserAgent ?? "unknown"}:{deviceInfo.IpAddress ?? "unknown"}";
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(identifier));
        return Convert.ToBase64String(hash);
    }

    /// <summary>
    /// Deviceテーブルにレコードを作成します
    /// </summary>
    private async Task<bool> CreateDeviceAsync(int userId, DeviceInfo deviceInfo, RefreshToken refreshToken)
    {
        var now = DateTime.UtcNow;
        var publicId = Guid.NewGuid().ToString("N").Substring(0, 8); // 短縮GUID
        var hashedIdentifier = GenerateDeviceIdentifier(deviceInfo);

        // 既存のデバイスを検索（同じ識別子のデバイスが存在するか）
        var existingDevice = await _context.Devices
            .Include(d => d.RefreshTokens) // RefreshTokensをロード
            .FirstOrDefaultAsync(d => d.UserId == userId && d.HashedIdentifier == hashedIdentifier && !d.IsRevoked);

        // デバイスの件数
        var deviceCount = await _context.Devices.CountAsync(d => d.UserId == userId && !d.IsRevoked);

        if (existingDevice != null)
        {
            // 既存デバイスの最終確認日時を更新
            existingDevice.LastSeenAt = now;
            existingDevice.LastIpMasked = MaskIpAddress(deviceInfo.IpAddress);
            existingDevice.Timezone = deviceInfo.Timezone;
            existingDevice.LastSeenLocation = deviceInfo.LastSeenLocation;

            // リフレッシュトークンをデバイスに関連付け（まだ関連付けられていない場合）
            if (!existingDevice.RefreshTokens.Any(rt => rt.Id == refreshToken.Id))
            {
                existingDevice.RefreshTokens.Add(refreshToken);
                refreshToken.DeviceId = existingDevice.Id; // 逆方向の関連付け
                refreshToken.Device = existingDevice;
            }

            await _context.SaveChangesAsync();
            return false; // 既存デバイスを更新しただけ
        }

        // 新しいデバイスを作成
        var device = new Device
        {
            PublicId = publicId,
            HashedIdentifier = hashedIdentifier,
            Name = deviceInfo.DeviceName,
            DeviceType = deviceInfo.DeviceType,
            OS = deviceInfo.OS,
            Client = deviceInfo.UserAgent,
            AppVersion = deviceInfo.AppVersion,
            FirstSeenAt = now,
            LastSeenAt = now,
            LastIpMasked = MaskIpAddress(deviceInfo.IpAddress),
            Timezone = deviceInfo.Timezone,
            LastSeenLocation = deviceInfo.LastSeenLocation,
            IsRevoked = false,
            UserId = userId,
            RefreshTokens = new List<RefreshToken> { refreshToken } // 作成時に直接関連付け
        };

        _context.Devices.Add(device);
        await _context.SaveChangesAsync();

        // RefreshTokenのDevice関連付けを更新
        refreshToken.DeviceId = device.Id;
        refreshToken.Device = device;
        await _context.SaveChangesAsync();

        return deviceCount > 0; // 1件もデバイスがない状態で新規デバイスを作成
    }
}