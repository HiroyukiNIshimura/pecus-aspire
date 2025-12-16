# Redis データベース分離設計

## 概要

本プロジェクトでは用途別に Redis インスタンスおよびデータベースを分離しています。
これにより、`FLUSHDB` などの操作が他の用途に影響を与えることを防ぎます。

## Redis インスタンス構成

本プロジェクトでは2つの Redis インスタンスを使用しています。

| インスタンス | Aspire リソース名 | 用途 | 参照プロジェクト |
|-------------|------------------|------|-----------------|
| Backend Redis | `redis` | WebApi / BackFire 用 | pecus.WebApi, pecus.BackFire |
| Frontend Redis | `redisFrontend` | フロントエンドセッション用 | pecus.Frontend |

## DB 番号の割り当て（Backend Redis）

| DB | 用途 | 実装箇所 | プレフィックス / 設定 |
|----|------|----------|----------------------|
| **db0** | トークンブラックリスト | `TokenBlacklistService` | `user_jtis:*`, `refresh:*`, `refresh_user:*` |
| **db1** | Hangfire（バックグラウンドジョブ） | `AppHost.cs` | `hangfire:*`（`RedisStorageOptions.Db = 1`） |
| **db2** | SignalR プレゼンス | `SignalRPresenceService` | `presence:conn_user:*`, `presence:conn_ws:*`, `presence:conn_item:*`, `presence:ws_conns:*` |

## DB 番号の割り当て（Frontend Redis）

| DB | 用途 | 実装箇所 | プレフィックス |
|----|------|----------|---------------|
| **db0** | セッション | `ServerSessionManager` | `session:*` |

## SignalR について

SignalR の Redis バックプレーンは **Pub/Sub** を使用します。
Redis の Pub/Sub は **DB を区別しない**（Redis の仕様）ため、DB 番号の指定は意味がありません。

代わりに **ChannelPrefix** で他の Pub/Sub と分離しています：
- チャンネル例: `Pecus.Hubs.NotificationHub:all`, `Pecus.Hubs.NotificationHub:internal:groups`

## 実装詳細

### TokenBlacklistService（db0）

```csharp
// pecus.WebApi/Services/TokenBlacklistService.cs
public TokenBlacklistService(IConnectionMultiplexer redis)
{
    _redis = redis;
    _db = _redis.GetDatabase();  // db0（デフォルト）
}
```

### Hangfire（db1）

```csharp
// pecus.WebApi/AppHost.cs, pecus.BackFire/AppHost.cs
builder.Services.AddHangfire((serviceProvider, configuration) =>
{
    var redis = builder.Configuration.GetConnectionString("redis");
    configuration.UseRedisStorage(redis, new RedisStorageOptions
    {
        Prefix = "hangfire:",
        Db = 1  // db1 を明示的に指定
    });
});
```

### SignalR（Pub/Sub）

```csharp
// pecus.WebApi/AppHost.cs
builder.Services.AddSignalR(options =>
    {
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
        options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    })
    .AddStackExchangeRedis(redisConnectionString, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("coati-signalr");
    });
```

### ServerSessionManager（Frontend Redis db0）

```typescript
// pecus.Frontend/src/libs/redis.ts
const redisOptions: RedisOptions = {
  ...parsedOptions,
  // db0（デフォルト）を使用
  retryStrategy: (times: number) => { ... },
  // ...
};
```

## Aspire 構成

```csharp
// pecus.AppHost/AppHost.cs
var redis = builder.AddRedis("redis");  // Backend 用
var redisFrontend = builder.AddRedis("redisFrontend");  // Frontend 用

var pecusApi = builder.AddProject<Projects.pecus_WebApi>("pecusapi")
    .WithReference(redis);

var backfire = builder.AddProject<Projects.pecus_BackFire>("backfire")
    .WithReference(redis);

var frontend = builder.AddNpmApp("frontend", "../pecus.Frontend", "dev")
    .WithReference(redisFrontend);
```

## 運用上の注意事項

### データクリア時

| 対象 | 手順 |
|------|------|
| トークンブラックリスト | Backend Redis に接続 → `SELECT 0` → `FLUSHDB` |
| Hangfire | Backend Redis に接続 → `SELECT 1` → `FLUSHDB` |
| SignalR プレゼンス | Backend Redis に接続 → `SELECT 2` → `FLUSHDB` |
| セッション | Frontend Redis に接続 → `SELECT 0` → `FLUSHDB` |

### 確認コマンド

```bash
# Backend Redis に接続（ポートは Aspire Dashboard で確認）
redis-cli -p <port>

# 各 DB のキー数を確認
SELECT 0
DBSIZE

SELECT 1
DBSIZE

SELECT 2
DBSIZE

# Pub/Sub チャンネルを確認（SignalR 用）
PUBSUB CHANNELS *
```

### 本番環境での注意

- Redis のパスワード設定を必ず行うこと
- `FLUSHALL` は両方のインスタンスに影響するため使用禁止
- バックアップ・リストア時は DB 番号を考慮すること
