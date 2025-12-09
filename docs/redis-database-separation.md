# Redis データベース分離設計

## 概要

本システムでは、用途別に Redis インスタンスおよびデータベースを分離しています。
これにより、`FLUSHDB` などの操作が他の用途に影響を与えることを防ぎます。

## Redis インスタンス構成

| Redis インスタンス | Aspire リソース名 | 用途 |
|---|---|---|
| **Backend Redis** | `redis` | WebApi 用（トークンブラックリスト、Hangfire、SignalR） |
| **Frontend Redis** | `redisFrontend` | フロントエンド用（セッション管理） |

## データベース番号の割り当て

### Backend Redis (`redis`)

| DB | 用途 | 実装箇所 | 設定方法 |
|---|---|---|---|
| **db0** | トークンブラックリスト | `TokenBlacklistService` | `GetDatabase(0)` |
| **db1** | Hangfire（バックグラウンドジョブ） | `AppHost.cs` | `defaultDatabase=1` |
| **db2** | SignalR（リアルタイム通知） | `AppHost.cs` | `defaultDatabase=2` |

### Frontend Redis (`redisFrontend`)

| DB | 用途 | 実装箇所 | 設定方法 |
|---|---|---|---|
| **db0** | セッション管理 | `ServerSessionManager` | `db: 0` |

## 実装詳細

### TokenBlacklistService (db0)

```csharp
// pecus.WebApi/Services/TokenBlacklistService.cs
public TokenBlacklistService(IConnectionMultiplexer redis)
{
    _redis = redis;
    _db = _redis.GetDatabase(0);  // 明示的に db0 を指定
}
```

### Hangfire (db1)

```csharp
// pecus.WebApi/AppHost.cs
builder.Services.AddHangfire((serviceProvider, configuration) =>
{
    var redis = builder.Configuration.GetConnectionString("redis");
    configuration.UseRedisStorage($"{redis},defaultDatabase=1",
        new RedisStorageOptions { Prefix = "hangfire:" });
});
```

### SignalR (db2)

```csharp
// pecus.WebApi/AppHost.cs
builder.Services.AddSignalR(options => { ... })
    .AddStackExchangeRedis($"{redisConnectionString},defaultDatabase=2", options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("coati-signalr");
    });
```

### ServerSessionManager (Frontend Redis db0)

```typescript
// pecus.Frontend/src/libs/redis.ts
const redisOptions: RedisOptions = {
  ...parsedOptions,
  db: 0,  // 明示的に db0 を指定
  // ...
};
```

## Aspire 構成

```csharp
// pecus.AppHost/AppHost.cs
var redis = builder.AddRedis("redis");  // Backend 用
var redisFrontend = builder.AddRedis("redisFrontend");  // Frontend 用

var pecusApi = builder.AddProject<Projects.pecus_WebApi>("pecusapi")
    .WithReference(redis);  // Backend Redis を参照

var frontend = builder.AddNpmApp("frontend", "../pecus.Frontend", "dev")
    .WithReference(redisFrontend);  // Frontend Redis を参照
```

## 注意事項

- 各 Redis インスタンスは独立しているため、`FLUSHALL` は両方に影響します
- `FLUSHDB` は指定した DB のみをクリアするため、用途別に安全に操作可能
- 本番環境では Redis のパスワード設定を必ず行うこと
