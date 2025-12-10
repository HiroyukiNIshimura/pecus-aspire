# SignalR 実装ガイド

## 概要

本プロジェクトでは SignalR を使用してリアルタイム通知を実装しています。このドキュメントでは、実装状況と設計方針を記載します。

## 実装状況（2025-12-10）

### 完了

- [x] JWT トークンに `organizationId` クレームを追加
- [x] `NotificationHub` をグループ管理専用にリファクタリング
- [x] 接続時に組織グループへ自動参加
- [x] ワークスペース/アイテムの排他的グループ参加
- [x] ワークスペースメンバーチェック（非メンバーはグループ参加不可）
- [x] フロントエンド `SignalRProvider` の更新
- [x] 暫定コード（`_recentJoins` など）の削除

### 未実装

- [ ] `NotificationService` による通知送信
- [ ] 各サービスからの通知送信呼び出し
- [ ] チャット機能（後述）

---

## グループ設計

### 通知用グループ

| グループ名 | 参加タイミング | 離脱タイミング | 排他的 | 補足 |
|-----------|---------------|---------------|--------|------|
| `organization:{organizationId}` | SignalR 接続時（自動） | 切断時 | No | JWT の `organizationId` から取得 |
| `workspace:{workspaceId}` | ワークスペースページ表示 | 別ワークスペースへ移動 or 切断 | Yes | メンバーチェックあり |
| `item:{itemId}` | アイテム詳細表示 | 別アイテムへ移動 or 切断 | Yes | workspace にも同時参加 |

### チャット用グループ（将来実装）

| グループ名 | 用途 | 補足 |
|-----------|------|------|
| `chat:{chatRoomId}` | チャットルーム | DB で管理（下記参照） |

### グループ参加の組み合わせ例

```
アイテム詳細表示中:
├── organization:1    （接続時に自動参加）
├── workspace:42      （アイテム参加時に自動参加）
└── item:123          （明示的に参加）

ワークスペース一覧表示中:
├── organization:1    （接続時に自動参加）
└── workspace:42      （明示的に参加）

ダッシュボード表示中:
└── organization:1    （接続時に自動参加）
```

---

## アーキテクチャ

### 原則

1. **Hub はグループ管理のみを担当**: 参加/離脱の処理だけを行う
2. **通知送信は NotificationService から**: ビジネスロジック層から通知を送信
3. **入退室通知のみ Hub で直接送信可**: チャットの入退室など、Hub イベントに直結するもの

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (React)                                                │
│ ┌─────────────────┐  ┌────────────────────────────────────────┐ │
│ │ SignalRProvider │  │ 各ページコンポーネント                  │
│ │ - connect()     │  │ - joinWorkspace() でグループ参加       │
│ │ - joinWorkspace │  │ - joinItem() でアイテムグループ参加    │
│ │ - joinItem      │  │ - onNotification() で通知受信          │
│ │ - onNotification│  │                                        │
│ └─────────────────┘  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend (ASP.NET Core)                                          │
│ ┌─────────────────┐  ┌────────────────────────────────────────┐ │
│ │ NotificationHub │  │ NotificationService                    │ │
│ │ - JoinWorkspace │  │ - SendToWorkspaceAsync()               │ │
│ │ - LeaveWorkspace│  │ - SendToOrganizationAsync()            │ │
│ │ - JoinItem      │  │ - SendToItemAsync()                    │ │
│ │ - LeaveItem     │  │ - SendToChatAsync()                    │ │
│ │ (グループ管理)   │  │                                        │ │
│ └─────────────────┘  └────────────────────────────────────────┘ │
│         │                          ▲                            │
│         │ メンバーチェック          │ IHubContext<NotificationHub>│
│         ▼                          │                            │
│ ┌─────────────────┐  ┌─────────────┴──────────────────────────┐ │
│ │ AccessHelper    │  │ 各 Service（WorkspaceItemService 等）   │ │
│ └─────────────────┘  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 実装詳細

### NotificationHub

```csharp
[Authorize]
public class NotificationHub : Hub
{
    private readonly OrganizationAccessHelper _accessHelper;

    // 接続時: 組織グループに自動参加
    public override async Task OnConnectedAsync()
    {
        var organizationId = GetOrganizationId(); // JWT から取得
        if (organizationId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"organization:{organizationId}");
        }
    }

    // ワークスペース参加（排他的、メンバーチェックあり）
    public async Task JoinWorkspace(int workspaceId, int? previousWorkspaceId = null)
    {
        var userId = GetUserId();
        if (!await _accessHelper.IsActiveWorkspaceMemberAsync(userId, workspaceId))
            return; // 非メンバーは静かにスキップ

        // 前のワークスペースから離脱
        if (previousWorkspaceId > 0 && previousWorkspaceId != workspaceId)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workspace:{previousWorkspaceId}");

        await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace:{workspaceId}");
    }

    // アイテム参加（排他的、ワークスペースにも同時参加）
    public async Task JoinItem(int itemId, int workspaceId, int? previousItemId, int? previousWorkspaceId)
    {
        // メンバーチェック後、workspace と item 両方のグループに参加
    }
}
```

### SignalRProvider（フロントエンド）

```typescript
interface SignalRContextValue {
  connectionState: SignalRConnectionState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinWorkspace: (workspaceId: number) => Promise<void>;
  leaveWorkspace: (workspaceId: number) => Promise<void>;
  joinItem: (itemId: number, workspaceId: number) => Promise<void>;
  leaveItem: (itemId: number) => Promise<void>;
  onNotification: (handler: NotificationHandler) => () => void;
  currentGroups: { workspaceId: number | null; itemId: number | null };
}
```

- 接続時に組織グループへの参加はサーバー側で自動処理
- `currentGroups` で現在参加中のワークスペース/アイテムを追跡
- 排他的参加: 新しいグループ参加時に前のグループIDをサーバーに送信

---

## チャット機能設計（将来実装）

### グループ形式

```
chat:{chatRoomId}
```

DB でチャットルームを管理し、1:1 DM もグループチャットも統一的に扱う。

### ChatRoom エンティティ

```csharp
public class ChatRoom
{
    public int Id { get; set; }
    public ChatRoomType Type { get; set; }  // Dm, Group, Ai
    public string? Name { get; set; }       // Group/Ai の場合のみ
    public int OrganizationId { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    // DM の重複防止用（例: "5_12" = ユーザー5とユーザー12）
    public string? DmUserPair { get; set; }

    public ICollection<ChatRoomMember> Members { get; set; }
    public ICollection<ChatMessage> Messages { get; set; }
}

public enum ChatRoomType
{
    Dm,      // 1:1 ダイレクトメッセージ
    Group,   // グループチャット（3人以上）
    Ai       // AI アシスタントとのチャット
}
```

### 通知の責任分担

| 通知タイプ | 送信元 | 理由 |
|-----------|--------|------|
| `chat:user_joined` | Hub | 入退室は Hub イベントに直結 |
| `chat:user_left` | Hub | 同上 |
| `chat:user_typing` | Hub | リアルタイム性が重要 |
| `chat:message_sent` | NotificationService | ビジネスロジック |
| `chat:message_read` | NotificationService | 同上 |

### Hub 実装例

```csharp
public async Task JoinChat(int chatRoomId)
{
    var userId = GetUserId();
    // メンバーチェック（ChatRoomMember に存在するか）

    var groupName = $"chat:{chatRoomId}";
    await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

    // 入室通知（自分以外に送信）
    await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("ReceiveNotification", new
    {
        EventType = "chat:user_joined",
        Payload = new { ChatRoomId = chatRoomId, UserId = userId },
        Timestamp = DateTimeOffset.UtcNow
    });
}
```

---

## 通知イベントタイプ一覧

### 通知系（NotificationService から送信）

| イベントタイプ | 説明 | ペイロード |
|---------------|------|-----------|
| `workspace_item:created` | アイテムが作成された | `{ ItemId, ItemCode, Subject, CreatedByUserId }` |
| `workspace_item:updated` | アイテムが更新された | `{ ItemId, ItemCode, UpdatedByUserId }` |
| `workspace_item:deleted` | アイテムが削除された | `{ ItemId, ItemCode, DeletedByUserId }` |
| `task:created` | タスクが作成された | `{ TaskId, ItemId, CreatedByUserId }` |
| `task:completed` | タスクが完了した | `{ TaskId, ItemId, CompletedByUserId }` |
| `comment:added` | コメントが追加された | `{ CommentId, ItemId, CreatedByUserId }` |

### アイテム編集系（Hub から送信）

| イベントタイプ | 説明 | ペイロード |
|---------------|------|-----------|
| `item:editing_started` | ユーザーがアイテム編集を開始 | `{ ItemId, UserId, UserName, IdentityIconUrl }` |
| `item:editing_ended` | ユーザーがアイテム編集を終了 | `{ ItemId, UserId }` |

### チャット系（Hub から送信）

| イベントタイプ | 説明 | ペイロード |
|---------------|------|-----------|
| `chat:user_joined` | ユーザーがチャットを開いた | `{ ChatRoomId, UserId }` |
| `chat:user_left` | ユーザーがチャットを閉じた | `{ ChatRoomId, UserId }` |
| `chat:user_typing` | ユーザーが入力中 | `{ ChatRoomId, UserId }` |

### チャット系（NotificationService から送信）

| イベントタイプ | 説明 | ペイロード |
|---------------|------|-----------|
| `chat:message_sent` | メッセージが送信された | `{ ChatRoomId, MessageId, SenderId, Content }` |
| `chat:message_read` | メッセージが既読になった | `{ ChatRoomId, MessageId, ReadByUserId }` |

---

## 注意事項

### スケールアウト時の考慮

- SignalR は Redis バックプレーンを使用しているため、複数サーバーインスタンス間で通知が共有される
- `static ConcurrentDictionary` のような状態管理は避ける（サーバー間で共有されない）

### パフォーマンス

- 頻繁な通知（タイピング中など）は debounce/throttle を検討
- 大量のメンバーがいるワークスペースでは通知の最適化が必要

### セキュリティ

- グループ参加時は必ずメンバーチェックを行う
- 非メンバーはエラーを返さず静かにスキップ（情報漏洩防止）

---

## 参考資料

- [ASP.NET Core SignalR ドキュメント](https://learn.microsoft.com/ja-jp/aspnet/core/signalr/)
- [SignalR Hub の設計ベストプラクティス](https://learn.microsoft.com/ja-jp/aspnet/core/signalr/hub-design)
