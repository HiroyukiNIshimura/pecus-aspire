# BackFire → SignalR 通知システム

## AI エージェント向け要約（必読）

このドキュメントでは、Hangfire ジョブ（pecus.BackFire）から SignalR 経由でクライアントにリアルタイム通知を送信する仕組みを説明します。

### 重要ポイント

1. **BackFire は SignalR Hub に直接アクセスできない** - 別プロセスのため
2. **Redis Pub/Sub を中継に使用** - BackFire → Redis → WebApi → SignalR → Client
3. **チャンネル名**: `coati:signalr:notifications`
4. **ChatBot 通知は GenerativeApiVendor チェックあり** - WebApi 側で None の場合はスキップ

### 主要ファイル

| ファイル | 役割 |
|---------|------|
| `pecus.Libs/Notifications/SignalRNotification.cs` | 通知メッセージの型定義 |
| `pecus.Libs/Notifications/SignalRNotificationPublisher.cs` | Redis に通知を Publish |
| `pecus.WebApi/Services/SignalRNotificationSubscriber.cs` | Redis を Subscribe し SignalR に転送 |

---

## アーキテクチャ概要

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   BackFire      │     │     Redis       │     │    WebApi       │     │    Client       │
│  (Hangfire)     │     │   Pub/Sub       │     │  (SignalR Hub)  │     │  (Browser)      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│                 │     │                 │     │                 │     │                 │
│ ChatBotTasks    │────▶│ Channel:        │────▶│ Subscriber      │────▶│ ReceiveNoti-    │
│ EmailTasks      │     │ coati:signalr:  │     │ BackgroundSvc   │     │ fication        │
│ その他タスク     │     │ notifications   │     │                 │     │                 │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 処理フロー

1. **Hangfire ジョブが実行される**（例: `ChatBotTasks.SendLoginWelcomeMessageAsync`）
2. **`SignalRNotificationPublisher.PublishAsync()`** で Redis に通知を Publish
3. **`SignalRNotificationSubscriber`**（WebApi の BackgroundService）が通知を受信
4. **ChatBot 通知の場合**: `GenerativeApiVendor` をチェック（None ならスキップ）
5. **SignalR Hub** 経由でクライアントに `ReceiveNotification` イベントを送信

---

## 使用方法

### 1. Hangfire タスクで通知を送信する

```csharp
using Pecus.Libs.Notifications;

public class ChatBotTasks
{
    private readonly SignalRNotificationPublisher _publisher;

    public ChatBotTasks(SignalRNotificationPublisher publisher)
    {
        _publisher = publisher;
    }

    public async Task SendMessageAsync(int organizationId, int roomId, string content)
    {
        // ... メッセージを DB に保存 ...

        // 通知を送信
        var payload = new
        {
            roomId = roomId,
            message = new { content = content }
        };

        // 方法1: ChatBot からの通知（GenerativeApiVendor チェックあり）
        await _publisher.PublishChatBotNotificationAsync(
            organizationId,
            roomId,
            "chat:message_received",
            payload
        );

        // 方法2: 汎用的な通知（チェックなし）
        await _publisher.PublishNotificationAsync(
            groupName: $"organization:{organizationId}",
            eventType: "custom:event",
            payload: payload
        );

        // 方法3: 完全なコントロール
        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:message_received",
            Payload = payload,
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        });
    }
}
```

### 2. DI 登録（BackFire）

`pecus.BackFire/AppHost.cs` に以下を追加:

```csharp
// SignalR 通知パブリッシャー
builder.Services.AddSingleton<SignalRNotificationPublisher>();

// Hangfire タスク
builder.Services.AddScoped<ChatBotTasks>();
```

### 3. グループ名の選択

SignalR グループ名は送信先を決定します。適切なグループを選択してください。

| グループ名 | 用途 | 参加タイミング |
|-----------|------|---------------|
| `organization:{orgId}` | 組織全体への通知 | ログイン時（自動） |
| `workspace:{workspaceId}` | ワークスペース参加者への通知 | ワークスペース画面表示時 |
| `item:{itemId}` | アイテム閲覧者への通知 | アイテム詳細表示時 |
| `chat:{roomId}` | チャットルーム参加者への通知 | チャット画面表示時 |
| `task:{taskId}` | タスク閲覧者への通知 | タスク詳細表示時 |

**重要**: ユーザーがまだグループに参加していない場合、通知は届きません。
ログイン直後のユーザーに通知を送る場合は `organization:{orgId}` を使用してください。

---

## 通知タイプ（SourceType）

`NotificationSourceType` で通知元を区別します:

| 値 | 説明 | WebApi での処理 |
|----|------|----------------|
| `System` | システム通知 | そのまま転送 |
| `User` | ユーザー起因の通知 | そのまま転送 |
| `ChatBot` | AI チャットボット | `GenerativeApiVendor` チェック |
| `SystemBot` | システムボット | そのまま転送 |

### ChatBot 通知の GenerativeApiVendor チェック

`SourceType = ChatBot` の場合、WebApi 側で以下のチェックが行われます:

```csharp
// SignalRNotificationSubscriber.cs
if (notification.SourceType == NotificationSourceType.ChatBot)
{
    var setting = await context.OrganizationSettings
        .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

    // GenerativeApiVendor が None の場合はスキップ
    if (setting?.GenerativeApiVendor == GenerativeApiVendor.None)
    {
        return; // 通知を送信しない
    }
}
```

---

## SignalRNotification 型

```csharp
public class SignalRNotification
{
    /// <summary>SignalR グループ名（送信先）</summary>
    public required string GroupName { get; init; }

    /// <summary>イベントタイプ（例: "chat:message_received"）</summary>
    public required string EventType { get; init; }

    /// <summary>通知ペイロード（JSON シリアライズされる）</summary>
    public required object Payload { get; init; }

    /// <summary>通知ソースタイプ</summary>
    public NotificationSourceType SourceType { get; init; } = NotificationSourceType.System;

    /// <summary>組織ID（ChatBot チェック用、オプション）</summary>
    public int? OrganizationId { get; init; }

    /// <summary>タイムスタンプ（自動設定）</summary>
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;
}
```

---

## クライアント側の受信

フロントエンドでは `ReceiveNotification` イベントをリッスンします:

```typescript
// SignalR 接続
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/notification")
    .build();

// 通知受信ハンドラ
connection.on("ReceiveNotification", (notification) => {
    console.log("Received:", notification);
    // notification.eventType で処理を分岐
    // notification.payload にデータ
    // notification.timestamp にタイムスタンプ
});
```

---

## テスト用コード

### ログイン時に ChatBot からウェルカムメッセージを送信

`EntranceAuthController.cs`:

```csharp
// ログイン成功後
if (user.OrganizationId.HasValue)
{
    var orgId = user.OrganizationId.Value;
    _backgroundJobClient.Enqueue<ChatBotTasks>(x =>
        x.SendLoginWelcomeMessageAsync(orgId, user.Id, user.Username)
    );
}
```

`ChatBotTasks.cs`:

```csharp
public async Task SendLoginWelcomeMessageAsync(int organizationId, int userId, string username)
{
    // 10秒待機（テスト用）
    await Task.Delay(TimeSpan.FromSeconds(10));

    // ... ChatBot を取得、AI ルームを取得/作成、メッセージを DB に保存 ...

    // 組織グループに通知（ログイン直後のユーザーにも届く）
    await _publisher.PublishAsync(new SignalRNotification
    {
        GroupName = $"organization:{organizationId}",
        EventType = "chat:message_received",
        Payload = payload,
        SourceType = NotificationSourceType.ChatBot,
        OrganizationId = organizationId,
    });
}
```

---

## トラブルシューティング

### 通知が届かない場合

1. **BackFire のログを確認**
   - `Published ChatBot notification: ... Receivers=1` が出ているか
   - `Receivers=0` の場合、WebApi が Subscribe していない

2. **WebApi のログを確認**
   - `SignalRNotificationSubscriber subscribed to channel` が起動時に出ているか
   - `Forwarded notification to SignalR` が出ているか
   - `ChatBot notification skipped (GenerativeApiVendor=None)` が出ていないか

3. **グループ名を確認**
   - クライアントがそのグループに参加しているか
   - ログイン直後なら `organization:{orgId}` を使用

4. **Redis 接続を確認**
   - BackFire と WebApi が同じ Redis に接続しているか

### ログレベル設定

詳細なログを確認するには `appsettings.Development.json` で設定:

```json
{
  "Logging": {
    "LogLevel": {
      "Pecus.Services.SignalRNotificationSubscriber": "Debug",
      "Pecus.Libs.Notifications.SignalRNotificationPublisher": "Debug"
    }
  }
}
```

---

## 関連ドキュメント

- `docs/spec/redis-database-separation.md` - Redis データベース分離設計
- `docs/spec/chat-feature-design.md` - チャット機能設計
- `docs/backend-guidelines.md` - バックエンドガイドライン
