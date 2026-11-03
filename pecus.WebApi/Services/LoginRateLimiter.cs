using StackExchange.Redis;

namespace Pecus.Services;

/// <summary>
/// ログイン・リカバリー系エンドポイント用のレート制限
/// </summary>
/// <remarks>
/// 固定ウィンドウ方式。Redis の INCR と有効期限で実装する。
/// 既存のパスワードログインにはレート制限が無いため、WebAuthn 追加に合わせて導入する。
/// </remarks>
public class LoginRateLimiter
{
    private const string KeyPrefix = "auth:ratelimit:";

    private readonly IDatabase _db;

    public LoginRateLimiter(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    /// <summary>
    /// 制限回数以内かどうかを判定し、回数を加算する
    /// </summary>
    /// <param name="key">制限単位（例: "login-options:{identifier}"）</param>
    /// <param name="limit">ウィンドウ内の上限回数</param>
    /// <param name="window">ウィンドウ幅</param>
    public async Task<bool> IsAllowedAsync(string key, int limit, TimeSpan window)
    {
        var redisKey = $"{KeyPrefix}{key}";
        var count = await _db.StringIncrementAsync(redisKey);

        if (count == 1)
        {
            await _db.KeyExpireAsync(redisKey, window);
        }

        return count <= limit;
    }
}
