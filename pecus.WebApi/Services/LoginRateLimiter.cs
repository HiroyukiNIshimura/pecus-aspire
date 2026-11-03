using System.Security.Cryptography;
using System.Text;
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

    /// <summary>
    /// INCR と初回のみの EXPIRE を 1 回のスクリプト実行でアトミックに行い、
    /// 途中で失敗した場合に TTL の無いキーが残り恒久的に制限されるのを防ぐ。
    /// </summary>
    private const string IncrementWithExpiryScript =
        "local count = redis.call('INCR', KEYS[1]) "
        + "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end "
        + "return count";

    private readonly IDatabase _db;

    public LoginRateLimiter(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    /// <summary>
    /// 長い識別子（クレデンシャルID・トークンなど）を制限キー用の短いハッシュに変換する
    /// </summary>
    /// <remarks>
    /// 制限キーはクライアントの入力から作られるため、値をそのまま Redis のキーにしない。
    /// </remarks>
    public static string HashKey(string value)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
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
        var ttlSeconds = Math.Max(1, (long)window.TotalSeconds);
        var count = (long)await _db.ScriptEvaluateAsync(
            IncrementWithExpiryScript,
            new RedisKey[] { redisKey },
            new RedisValue[] { ttlSeconds });

        return count <= limit;
    }
}
