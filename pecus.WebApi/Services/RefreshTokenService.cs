using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using StackExchange.Redis;
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

    public RefreshTokenService(IConnectionMultiplexer redis, ApplicationDbContext context)
    {
        _redis = redis;
        _db = _redis.GetDatabase();
        _context = context;
    }

    public record RefreshTokenInfo(string Token, int UserId, DateTime ExpiresAt);

    /// <summary>
    /// リフレッシュトークンを作成します。
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    public async Task<RefreshTokenInfo> CreateRefreshTokenAsync(int userId)
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

        return info;
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
                var info = JsonSerializer.Deserialize<RefreshTokenInfo>(payload!);
                if (info != null && info.ExpiresAt > DateTime.UtcNow)
                {
                    return info;
                }
            }
            catch { }
        }

        // 2. Redis にない場合は DB から復元（再起動後など）
        var dbToken = await _context.RefreshTokens
            .Where(t => t.Token == token && !t.IsRevoked && t.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();

        if (dbToken == null) return null;

        // Redis に再キャッシュ
        var restored = new RefreshTokenInfo(dbToken.Token, dbToken.UserId, dbToken.ExpiresAt);
        var restoredPayload = JsonSerializer.Serialize(restored);
        await _db.StringSetAsync(key, restoredPayload, dbToken.ExpiresAt - DateTime.UtcNow);

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
    /// <returns></returns> <summary>
    ///
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

        // 2. DB でも無効化フラグを立てる（監査用）
        var dbToken = await _context.RefreshTokens
            .Where(t => t.Token == token)
            .FirstOrDefaultAsync();

        if (dbToken != null)
        {
            dbToken.IsRevoked = true;
            await _context.SaveChangesAsync();
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

        // 2. DB でもユーザーの全トークンを無効化（監査用）
        var dbTokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ToListAsync();

        foreach (var dbToken in dbTokens)
        {
            dbToken.IsRevoked = true;
        }

        if (dbTokens.Any())
        {
            await _context.SaveChangesAsync();
        }
    }

    private static string GetKey(string token) => $"refresh:{token}";
    private static string GetUserKey(int userId) => $"refresh_user:{userId}";
}
