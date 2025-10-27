using Pecus.Libs;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace Pecus.Services;

/// <summary>
/// Redis を利用するリフレッシュトークン管理サービス
/// </summary>
public class RefreshTokenService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;

    // TTL for refresh tokens (days)
    private readonly TimeSpan _refreshTokenTtl = TimeSpan.FromDays(30);

    public RefreshTokenService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = _redis.GetDatabase();
    }

    public record RefreshTokenInfo(string Token, int UserId, DateTime ExpiresAt);

    public async Task<RefreshTokenInfo> CreateRefreshTokenAsync(int userId)
    {
        var token = Guid.NewGuid().ToString("N");
        var expiresAt = DateTime.UtcNow.Add(_refreshTokenTtl);

        var info = new RefreshTokenInfo(token, userId, expiresAt);

        var key = GetKey(token);
        var payload = JsonSerializer.Serialize(info);
        await _db.StringSetAsync(key, payload, expiresAt - DateTime.UtcNow);

        // track per-user tokens with a Redis set
        var userKey = GetUserKey(userId);
        await _db.SetAddAsync(userKey, token);
        await _db.KeyExpireAsync(userKey, TimeSpan.FromDays(31));

        return info;
    }

    public async Task<RefreshTokenInfo?> ValidateRefreshTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var key = GetKey(token);
        var payload = await _db.StringGetAsync(key);
        if (payload.IsNullOrEmpty) return null;

        try
        {
            var info = JsonSerializer.Deserialize<RefreshTokenInfo>(payload!);
            if (info != null && info.ExpiresAt > DateTime.UtcNow) return info;
        }
        catch { }

        return null;
    }

    public async Task RevokeRefreshTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return;
        var key = GetKey(token);
        var payload = await _db.StringGetAsync(key);
        if (!payload.IsNullOrEmpty)
        {
            try
            {
                var info = JsonSerializer.Deserialize<RefreshTokenInfo>(payload!);
                if (info != null)
                {
                    var userKey = GetUserKey(info.UserId);
                    await _db.SetRemoveAsync(userKey, token);
                }
            }
            catch { }
        }

        await _db.KeyDeleteAsync(key);
    }

    public async Task RevokeAllUserRefreshTokensAsync(int userId)
    {
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
    }

    private static string GetKey(string token) => $"refresh:{token}";
    private static string GetUserKey(int userId) => $"refresh_user:{userId}";
}
