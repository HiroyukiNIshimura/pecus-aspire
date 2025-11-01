using StackExchange.Redis;

namespace Pecus.Services;

/// <summary>
/// Redis ベースのトークンブラックリスト管理サービス
/// </summary>
public class TokenBlacklistService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;

    public TokenBlacklistService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = _redis.GetDatabase();
    }

    public async Task BlacklistTokenAsync(string jti, DateTime expiresAt)
    {
        if (string.IsNullOrWhiteSpace(jti)) return;
        var key = GetKey(jti);
        var ttl = expiresAt - DateTime.UtcNow;
        if (ttl <= TimeSpan.Zero) ttl = TimeSpan.FromMinutes(5);
        await _db.StringSetAsync(key, "1", ttl);
    }

    public async Task<bool> IsTokenBlacklistedAsync(string jti)
    {
        if (string.IsNullOrWhiteSpace(jti)) return false;
        var key = GetKey(jti);
        return await _db.KeyExistsAsync(key);
    }

    public async Task BlacklistAllUserTokensAsync(int userId)
    {
        var userKey = GetUserListKey(userId);
        var members = await _db.SetMembersAsync(userKey);
        foreach (var jtiVal in members)
        {
            if (jtiVal.IsNullOrEmpty) continue;
            var jti = jtiVal.ToString();
            if (string.IsNullOrWhiteSpace(jti)) continue;
            await _db.StringSetAsync(GetKey(jti), "1", TimeSpan.FromDays(30));
        }
    }

    public async Task BlacklistAllUserTokensExceptCurrentAsync(int userId, string currentJti)
    {
        var userKey = GetUserListKey(userId);
        var members = await _db.SetMembersAsync(userKey);
        foreach (var jti in members)
        {
            if (jti.IsNullOrEmpty) continue;
            var s = jti.ToString();
            if (s == currentJti) continue;
            await _db.StringSetAsync(GetKey(s), "1", TimeSpan.FromDays(30));
        }
    }

    public Task<bool> IsUserTokenInvalidatedAsync(int userId, long issuedAt, string jti)
    {
        // 発行時刻ベースの無効化は現時点ではサポートしない
        return Task.FromResult(false);
    }

    public async Task RegisterUserJtiAsync(int userId, string jti)
    {
        if (string.IsNullOrWhiteSpace(jti)) return;
        var userKey = GetUserListKey(userId);
        await _db.SetAddAsync(userKey, jti);
        await _db.KeyExpireAsync(userKey, TimeSpan.FromDays(31));
        // keep set trimmed to e.g. 200 members could be implemented later
    }

    /// <summary>
    /// 単一の Redis 呼び出しでトークンが無効化されているか確認する（ブラックリストまたはユーザー無効化時刻の照会）
    /// </summary>
    public async Task<bool> IsTokenRevokedAsync(int userId, long issuedAtUnixSeconds, string jti)
    {
        // prepare keys
        var blacklistKey = GetKey(jti);
        var userInvalidKey = $"user_invalid_before:{userId}";

        // Lua スクリプト: 1) blacklistKey が存在する -> return 1
        // 2) userInvalidKey が存在し、userInvalid >= issuedAtUnixSeconds -> return 1
        // else return 0
        var script = @"
            if redis.call('EXISTS', KEYS[1]) == 1 then
                return 1
            end
            local invalid = redis.call('GET', KEYS[2])
            if invalid then
                local inval = tonumber(invalid)
                local iat = tonumber(ARGV[1])
                if inval >= iat then
                    return 1
                end
            end
            return 0
        ";

        var result = (int)await _db.ScriptEvaluateAsync(script, new RedisKey[] { blacklistKey, userInvalidKey }, new RedisValue[] { issuedAtUnixSeconds });
        return result == 1;
    }

    /// <summary>
    /// ユーザー単位で、指定時刻以降のトークンを無効化する（issuedAt がこの値以下のトークンは無効化される）
    /// </summary>
    public async Task InvalidateUserTokensBeforeAsync(int userId, long unixSeconds)
    {
        var key = $"user_invalid_before:{userId}";
        await _db.StringSetAsync(key, unixSeconds.ToString(), TimeSpan.FromDays(31));
    }

    private static string GetKey(string jti) => $"blacklist:{jti}";
    private static RedisKey GetUserListKey(int userId) => new RedisKey($"user_jtis:{userId}");
}
