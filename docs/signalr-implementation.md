# SignalR 実装ガイド

## 概要

本プロジェクトでは SignalR を使用してリアルタイム通知を実装しています。このドキュメントでは、現在の実装状況と今後の実装方針を記載します。

## 現在の実装状況（2025-12-09）

### 疎通テスト完了

- ワークスペース詳細ページで SignalR 接続が確立される
- ユーザーがワークスペースにアクセスすると、他のメンバーに通知が表示される
- React StrictMode による重複通知問題を解決済み

### 暫定実装（要リファクタリング）

現在の `NotificationHub.JoinWorkspace` には以下の問題があります：

```csharp
// ❌ 現在の実装: グループ参加と通知送信が混在
public async Task JoinWorkspace(int workspaceId, string userName)
{
    // グループ参加
    await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

    // 通知送信（本来ここにあるべきではない）
    await Clients.GroupExcept(...).SendAsync("ReceiveNotification", ...);
}
```

## 本番向け設計方針

### 原則

1. **Hub はグループ管理のみを担当**: 参加/離脱の処理だけを行う
2. **通知送信は NotificationService から**: ビジネスロジック層から通知を送信
3. **Hub から直接通知を送らない**: Hub メソッドはクライアントからの呼び出しに応答するだけ

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (React)                                                │
│ ┌─────────────────┐  ┌────────────────────────────────────────┐ │
│ │ SignalRProvider │  │ WorkspaceDetailClient                  │ │
│ │ - connect()     │  │ - joinWorkspace() でグループ参加       │ │
│ │ - onNotification│  │ - onNotification() で通知受信          │ │
│ └─────────────────┘  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend (ASP.NET Core)                                          │
│ ┌─────────────────┐  ┌────────────────────────────────────────┐ │
│ │ NotificationHub │  │ NotificationService                    │ │
│ │ - JoinWorkspace │  │ - SendToWorkspaceAsync()               │ │
│ │ - LeaveWorkspace│  │ - SendToUserAsync()                    │ │
│ │ (グループ管理のみ)│  │ - SendToOrganizationAsync()            │ │
│ └─────────────────┘  └────────────────────────────────────────┘ │
│                              ▲                                   │
│                              │ IHubContext<NotificationHub>     │
│ ┌────────────────────────────┴────────────────────────────────┐ │
│ │ WorkspaceService / WorkspaceItemService / etc.              │ │
│ │ - アイテム作成時に NotificationService.SendToWorkspace()     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 実装例

#### 1. NotificationHub（グループ管理のみ）

```csharp
[Authorize]
public class NotificationHub : Hub
{
    public async Task JoinWorkspace(int workspaceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace:{workspaceId}");
    }

    public async Task LeaveWorkspace(int workspaceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workspace:{workspaceId}");
    }

    // 通知送信メソッドは持たない
}
```

#### 2. NotificationService（通知送信）

```csharp
public class NotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    /// <summary>
    /// ワークスペースの全メンバーに通知を送信
    /// </summary>
    public async Task SendToWorkspaceAsync(int workspaceId, string eventType, object payload)
    {
        await _hubContext.Clients
            .Group($"workspace:{workspaceId}")
            .SendAsync("ReceiveNotification", new
            {
                EventType = eventType,
                Payload = payload,
                Timestamp = DateTimeOffset.UtcNow
            });
    }

    /// <summary>
    /// ワークスペースの特定ユーザー以外に通知を送信
    /// </summary>
    public async Task SendToWorkspaceExceptUserAsync(int workspaceId, int excludeUserId, string eventType, object payload)
    {
        await _hubContext.Clients
            .GroupExcept($"workspace:{workspaceId}", GetConnectionIdsForUser(excludeUserId))
            .SendAsync("ReceiveNotification", new
            {
                EventType = eventType,
                Payload = payload,
                Timestamp = DateTimeOffset.UtcNow
            });
    }

    /// <summary>
    /// 特定ユーザーに通知を送信
    /// </summary>
    public async Task SendToUserAsync(int userId, string eventType, object payload)
    {
        await _hubContext.Clients
            .Group($"user:{userId}")
            .SendAsync("ReceiveNotification", new
            {
                EventType = eventType,
                Payload = payload,
                Timestamp = DateTimeOffset.UtcNow
            });
    }
}
```

#### 3. サービス層での使用例

```csharp
public class WorkspaceItemService
{
    private readonly NotificationService _notificationService;

    public async Task<WorkspaceItem> CreateItemAsync(CreateWorkspaceItemRequest request, int userId)
    {
        // アイテム作成処理...
        var item = await _context.WorkspaceItems.AddAsync(...);
        await _context.SaveChangesAsync();

        // 通知送信（作成者以外に）
        await _notificationService.SendToWorkspaceExceptUserAsync(
            item.WorkspaceId,
            userId,
            "workspace_item:created",
            new
            {
                ItemId = item.Id,
                ItemCode = item.Code,
                Subject = item.Subject,
                CreatedBy = userName
            }
        );

        return item;
    }
}
```

## 通知イベントタイプ一覧（予定）

| イベントタイプ | 説明 | ペイロード |
|---------------|------|-----------|
| `workspace:user_joined` | ユーザーがワークスペースにアクセス | `{ UserId, UserName }` |
| `workspace:user_left` | ユーザーがワークスペースから離脱 | `{ UserId, UserName }` |
| `workspace_item:created` | アイテムが作成された | `{ ItemId, ItemCode, Subject, CreatedBy }` |
| `workspace_item:updated` | アイテムが更新された | `{ ItemId, ItemCode, Subject, UpdatedBy }` |
| `workspace_item:deleted` | アイテムが削除された | `{ ItemId, ItemCode, DeletedBy }` |
| `workspace_item:assigned` | アイテムがアサインされた | `{ ItemId, AssigneeId, AssigneeName }` |
| `task:created` | タスクが作成された | `{ TaskId, ItemId, Content, CreatedBy }` |
| `task:completed` | タスクが完了した | `{ TaskId, ItemId, CompletedBy }` |
| `comment:added` | コメントが追加された | `{ CommentId, ItemId, Content, CreatedBy }` |

## TODO

- [ ] `NotificationHub` から通知送信ロジックを削除し、グループ管理のみにする
- [ ] `NotificationService` に通知送信メソッドを集約
- [ ] 各サービスで適切なタイミングで通知を送信
- [ ] フロントエンドで通知タイプごとの表示処理を実装
- [ ] 既存の暫定コード（StrictMode 対策の `_recentJoins`）を削除

## 注意事項

### スケールアウト時の考慮

- SignalR は Redis バックプレーンを使用しているため、複数サーバーインスタンス間で通知が共有される
- `static ConcurrentDictionary` のような状態管理は避ける（サーバー間で共有されない）

### パフォーマンス

- 頻繁な通知（タイピング中など）は debounce/throttle を検討
- 大量のメンバーがいるワークスペースでは通知の最適化が必要

## 参考資料

- [ASP.NET Core SignalR ドキュメント](https://learn.microsoft.com/ja-jp/aspnet/core/signalr/)
- [SignalR Hub の設計ベストプラクティス](https://learn.microsoft.com/ja-jp/aspnet/core/signalr/hub-design)
