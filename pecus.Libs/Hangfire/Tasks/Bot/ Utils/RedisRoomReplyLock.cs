using StackExchange.Redis;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Utils;

/// <summary>
/// Redis を使用したルーム単位の分散ロック実装
/// Hangfire と同じ db1 を使用し、プレフィックスで分離
/// </summary>
public class RedisRoomReplyLock : IRoomReplyLock
{
    private readonly IConnectionMultiplexer _redis;
    private const string KeyPrefix = "bot-reply-lock:room:";
    private const int DatabaseNumber = 1;

    /// <summary>
    /// RedisRoomReplyLock のコンストラクタ
    /// </summary>
    /// <param name="redis">Redis 接続マルチプレクサ</param>
    public RedisRoomReplyLock(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    /// <inheritdoc />
    public async Task<IAsyncDisposable?> TryAcquireAsync(int roomId, TimeSpan ttl)
    {
        var db = _redis.GetDatabase(DatabaseNumber);
        var key = $"{KeyPrefix}{roomId}";
        var lockValue = Guid.NewGuid().ToString();

        var acquired = await db.StringSetAsync(key, lockValue, ttl, When.NotExists);

        if (!acquired)
        {
            return null;
        }

        return new LockHandle(db, key, lockValue);
    }

    private sealed class LockHandle : IAsyncDisposable
    {
        private readonly IDatabase _db;
        private readonly string _key;
        private readonly string _lockValue;

        public LockHandle(IDatabase db, string key, string lockValue)
        {
            _db = db;
            _key = key;
            _lockValue = lockValue;
        }

        public async ValueTask DisposeAsync()
        {
            // 自分が取得したロックのみ解放（Lua スクリプトで原子的に）
            const string script = """
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end
                """;

            await _db.ScriptEvaluateAsync(script, [(RedisKey)_key], [(RedisValue)_lockValue]);
        }
    }
}