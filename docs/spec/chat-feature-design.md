# チャット機能設計

## 概要

組織内のユーザー間コミュニケーションを実現するチャット機能の設計ドキュメントです。
1:1 DM、グループチャット、AI アシスタントとの会話を統一的に管理します。

## ユースケース

| ユースケース | 説明 |
|-------------|------|
| ユーザーと AI アシスタント | AI との対話セッション |
| ユーザー A とユーザー B の 1:1 DM | ダイレクトメッセージ |
| 組織グループチャット | 組織全体のチャットルーム（組織ごとに1つ） |
| ワークスペースグループチャット | ワークスペースメンバーのチャットルーム（ワークスペースごとに1つ） |
| システムからの通知 | システムからの通知を自由に送信できる |

---

## DB 設計

### ER図

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│   ChatRoom      │       │   ChatRoomMember    │       │      User       │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ Id (PK)         │──┐    │ Id (PK)             │    ┌──│ Id (PK)         │
│ Type            │  │    │ ChatRoomId (FK)     │────┘  │ Username        │
│ Name            │  └───>│ UserId (FK)         │───────│ ...             │
│ OrganizationId  │       │ Role                │       └─────────────────┘
│ WorkspaceId     │  ← ワークスペースグループチャットの場合に使用（nullable）
│ DmUserPair      │       │ JoinedAt            │
│ CreatedByUserId │       │ LastReadAt          │
│ CreatedAt       │       │ NotificationSetting │
│ UpdatedAt       │       └─────────────────────┘
│ RowVersion      │
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐
│   ChatMessage   │
├─────────────────┤
│ Id (PK)         │
│ ChatRoomId (FK) │
│ SenderUserId    │  ← AI メッセージの場合は null
│ MessageType     │
│ Content         │
│ CreatedAt       │
│ ReplyToMessageId│
└─────────────────┘
```

---

### ChatRoom（チャットルーム）

チャットルームを管理するエンティティ。DM もグループチャットも統一的に扱う。

```csharp
public class ChatRoom
{
    /// <summary>
    /// チャットルームID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// チャットルームタイプ
    /// </summary>
    public ChatRoomType Type { get; set; }

    /// <summary>
    /// ルーム名（Group/Ai の場合に使用、Dm は null）
    /// </summary>
    [MaxLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// 組織ID（組織内チャットの場合）
    /// </summary>
    public int OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// ワークスペースID（ワークスペースグループチャットの場合）
    /// null の場合は組織全体のグループチャット
    /// </summary>
    public int? WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }

    /// <summary>
    /// DM の重複防止用ユーザーペア
    /// 小さいID_大きいID 形式（例: "5_12"）
    /// Dm タイプの場合のみ使用
    /// </summary>
    [MaxLength(50)]
    public string? DmUserPair { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 更新日時（最終メッセージ送信時に更新）
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// 楽観的ロック用
    /// </summary>
    public uint RowVersion { get; set; }

    // Navigation Properties
    public ICollection<ChatRoomMember> Members { get; set; } = new List<ChatRoomMember>();
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
```

### ChatRoomType（チャットルームタイプ）

```csharp
public enum ChatRoomType
{
    /// <summary>
    /// 1:1 ダイレクトメッセージ（メンバー2人固定）
    /// </summary>
    Dm = 0,

    /// <summary>
    /// グループチャット
    /// - 組織グループ: WorkspaceId = null、組織ごとに1つ存在し全メンバーが参加
    /// - ワークスペースグループ: WorkspaceId 指定、ワークスペースごとに1つ存在しメンバーのみ参加
    /// </summary>
    Group = 1,

    /// <summary>
    /// AI アシスタントとのチャット
    /// ChatRoomMember は人間ユーザー1人のみ
    /// AI からのメッセージは SenderUserId = null, MessageType = Ai で表現
    /// </summary>
    Ai = 2,

    /// <summary>
    /// システム通知ルーム
    /// 組織ごとに1つ存在し、全メンバーが参加
    /// 運営からのお知らせ、アラートなどを配信
    /// </summary>
    System = 3,
}
```

---

### ChatRoomMember（チャットルームメンバー）

チャットルームの参加者を管理する中間テーブル。

```csharp
public class ChatRoomMember
{
    /// <summary>
    /// メンバーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// チャットルームID
    /// </summary>
    public int ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;

    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>
    /// ルーム内での役割
    /// </summary>
    public ChatRoomRole Role { get; set; } = ChatRoomRole.Member;

    /// <summary>
    /// 参加日時
    /// </summary>
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 最終既読日時（この日時以前のメッセージは既読）
    /// </summary>
    public DateTimeOffset? LastReadAt { get; set; }

    /// <summary>
    /// 通知設定（ミュートなど）
    /// </summary>
    public ChatNotificationSetting NotificationSetting { get; set; } = ChatNotificationSetting.All;
}
```

### ChatRoomRole（チャットルーム内役割）

```csharp
public enum ChatRoomRole
{
    /// <summary>
    /// 一般メンバー
    /// </summary>
    Member = 0,

    /// <summary>
    /// 管理者（メンバー追加/削除、ルーム設定変更可能）
    /// </summary>
    Admin = 1,

    /// <summary>
    /// オーナー（ルーム削除可能）
    /// </summary>
    Owner = 2,
}
```

### ChatNotificationSetting（通知設定）

```csharp
public enum ChatNotificationSetting
{
    /// <summary>
    /// すべての通知を受け取る
    /// </summary>
    All = 0,

    /// <summary>
    /// メンション時のみ通知
    /// </summary>
    MentionsOnly = 1,

    /// <summary>
    /// 通知オフ（ミュート）
    /// </summary>
    Muted = 2,
}
```

---

### ChatMessage（チャットメッセージ）

チャットメッセージを管理するエンティティ。

> **Note**: メッセージの編集・削除機能は MVP では対象外。将来必要になった場合は別途検討。

```csharp
public class ChatMessage
{
    /// <summary>
    /// メッセージID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// チャットルームID
    /// </summary>
    public int ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;

    /// <summary>
    /// 送信者ユーザーID
    /// AI からのメッセージの場合は null（MessageType = Ai と併用）
    /// </summary>
    public int? SenderUserId { get; set; }
    public User? SenderUser { get; set; }

    /// <summary>
    /// メッセージタイプ
    /// </summary>
    public ChatMessageType MessageType { get; set; } = ChatMessageType.Text;

    /// <summary>
    /// メッセージ本文（Lexical JSON または プレーンテキスト）
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 送信日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 返信先メッセージID（スレッド返信の場合）
    /// </summary>
    public int? ReplyToMessageId { get; set; }
    public ChatMessage? ReplyToMessage { get; set; }
}
```

### ChatMessageType（メッセージタイプ）

```csharp
public enum ChatMessageType
{
    /// <summary>
    /// テキストメッセージ
    /// </summary>
    Text = 0,

    /// <summary>
    /// システムメッセージ（システム通知ルームで使用）
    /// </summary>
    System = 1,

    /// <summary>
    /// AI アシスタントからのメッセージ
    /// </summary>
    Ai = 2,

    /// <summary>
    /// ファイル添付メッセージ
    /// </summary>
    File = 3,
}
```

---

## インデックス設計

### ChatRoom

```csharp
// DM の重複防止（同じ2人のDMは1つのみ）
entity.HasIndex(e => new { e.OrganizationId, e.DmUserPair })
    .IsUnique()
    .HasFilter("\"Type\" = 0");  // Dm タイプのみ

// ワークスペースグループチャットの重複防止（1ワークスペース1グループ）
entity.HasIndex(e => new { e.OrganizationId, e.WorkspaceId })
    .IsUnique()
    .HasFilter("\"Type\" = 1 AND \"WorkspaceId\" IS NOT NULL");  // Group タイプかつワークスペース指定あり

// 組織内のチャットルーム一覧取得用
entity.HasIndex(e => e.OrganizationId);

// ワークスペース内のチャットルーム取得用
entity.HasIndex(e => e.WorkspaceId);
```

### ChatRoomMember

```csharp
// ユーザーの参加ルーム一覧取得用
entity.HasIndex(e => e.UserId);

// ルームのメンバー一覧取得用
entity.HasIndex(e => e.ChatRoomId);

// ユーザー × ルームの重複防止
entity.HasIndex(e => new { e.ChatRoomId, e.UserId }).IsUnique();
```

### ChatMessage

```csharp
// ルーム内のメッセージ一覧取得用（日時降順）
entity.HasIndex(e => new { e.ChatRoomId, e.CreatedAt });
```

---

## DM 重複防止ロジック

1:1 DM では、同じ2人のルームが複数作成されないようにする。

```csharp
public class ChatRoomService
{
    /// <summary>
    /// DM 用のユーザーペア文字列を生成
    /// </summary>
    private static string GenerateDmUserPair(int userId1, int userId2)
    {
        var min = Math.Min(userId1, userId2);
        var max = Math.Max(userId1, userId2);
        return $"{min}_{max}";
    }

    /// <summary>
    /// DM ルームを取得または作成
    /// </summary>
    public async Task<ChatRoom> GetOrCreateDmRoomAsync(int userId1, int userId2, int organizationId)
    {
        var dmUserPair = GenerateDmUserPair(userId1, userId2);

        // 既存のDMルームを検索
        var existingRoom = await _context.ChatRooms
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == organizationId &&
                r.Type == ChatRoomType.Dm &&
                r.DmUserPair == dmUserPair);

        if (existingRoom != null)
        {
            return existingRoom;
        }

        // 新規作成
        var room = new ChatRoom
        {
            Type = ChatRoomType.Dm,
            OrganizationId = organizationId,
            DmUserPair = dmUserPair,
            CreatedByUserId = userId1,
            Members = new List<ChatRoomMember>
            {
                new() { UserId = userId1, Role = ChatRoomRole.Member },
                new() { UserId = userId2, Role = ChatRoomRole.Member },
            }
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        return room;
    }
}

---

## ワークスペースグループルーム管理

```csharp
public class ChatRoomService
{
    /// <summary>
    /// ワークスペースのグループチャットルームを取得または作成
    /// </summary>
    public async Task<ChatRoom> GetOrCreateWorkspaceGroupRoomAsync(int workspaceId, int createdByUserId)
    {
        // 既存のワークスペースグループルームを検索
        var existingRoom = await _context.ChatRooms
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r =>
                r.WorkspaceId == workspaceId &&
                r.Type == ChatRoomType.Group);

        if (existingRoom != null)
        {
            return existingRoom;
        }

        var workspace = await _context.Workspaces
            .Include(w => w.Organization)
            .FirstOrDefaultAsync(w => w.Id == workspaceId)
            ?? throw new NotFoundException($"Workspace {workspaceId} not found");

        // 新規作成
        var room = new ChatRoom
        {
            Type = ChatRoomType.Group,
            Name = workspace.Name,  // ワークスペース名をルーム名に設定
            OrganizationId = workspace.OrganizationId,
            WorkspaceId = workspaceId,
            CreatedByUserId = createdByUserId,
            Members = new List<ChatRoomMember>
            {
                new() { UserId = createdByUserId, Role = ChatRoomRole.Owner },
            }
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        return room;
    }

    /// <summary>
    /// ユーザーをワークスペースのグループチャットに追加
    /// </summary>
    public async Task AddUserToWorkspaceRoomAsync(int userId, int workspaceId)
    {
        var room = await _context.ChatRooms
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r =>
                r.WorkspaceId == workspaceId &&
                r.Type == ChatRoomType.Group);

        if (room == null)
        {
            return;  // ワークスペースにチャットルームがない場合は何もしない
        }

        if (room.Members.Any(m => m.UserId == userId))
        {
            return;  // 既に参加済み
        }

        room.Members.Add(new ChatRoomMember
        {
            UserId = userId,
            Role = ChatRoomRole.Member,
        });

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// ユーザーをワークスペースのグループチャットから削除
    /// </summary>
    public async Task RemoveUserFromWorkspaceRoomAsync(int userId, int workspaceId)
    {
        var room = await _context.ChatRooms
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r =>
                r.WorkspaceId == workspaceId &&
                r.Type == ChatRoomType.Group);

        if (room == null)
        {
            return;
        }

        var member = room.Members.FirstOrDefault(m => m.UserId == userId);
        if (member != null)
        {
            room.Members.Remove(member);
            await _context.SaveChangesAsync();
        }
    }
}
```


---

## SignalR グループ

### DB とは独立したリアルタイム配信の仕組み

SignalR グループは **DB のチャットルームとは独立した概念** である。

- **DB（ChatRoom テーブル）**: メッセージの永続化、履歴管理、既読状態の保存
- **SignalR グループ**: リアルタイム通知の配信先を管理する一時的なメモリ上の仕組み

SignalR グループは「今この瞬間、どのクライアントにメッセージを届けるか」を管理するもので、DB のルーム ID をグループ名に利用しているだけ。両者に直接的な依存関係はない。

```
┌─────────────────────────────────────────────────────────────┐
│                      メッセージ送信の流れ                     │
├─────────────────────────────────────────────────────────────┤
│  1. クライアント → API → DB に ChatMessage を INSERT         │
│  2. INSERT 成功後、SignalR グループに通知を PUB              │
│  3. グループに参加中のクライアントがリアルタイムで受信        │
└─────────────────────────────────────────────────────────────┘
```

### グループ構成

チャット機能では以下のグループを使用：

| ChatRoomType | SignalR グループ | 説明 |
|--------------|------------------|------|
| Dm | `chat:{chatRoomId}` | DM ルーム専用 |
| Group（組織） | `chat:{chatRoomId}` | 組織グループチャット専用 |
| Group（ワークスペース） | `chat:{chatRoomId}` | ワークスペースグループチャット専用 |
| Ai | `chat:{chatRoomId}` | AI チャット専用 |
| System | `organization:{organizationId}` | 組織全体への通知 |

### 参加/離脱タイミング

| タイミング | 処理 |
|-----------|------|
| チャット画面を開いた | `JoinChat(chatRoomId)` でグループ参加 + 入室通知 |
| チャット画面を閉じた | `LeaveChat(chatRoomId)` でグループ離脱 + 退室通知 |
| 切断時 | SignalR が自動でグループ離脱 |

> **Note**: `organization:{organizationId}` グループはログイン時に自動参加（既存実装）

### 通知イベント

| イベント | 送信先グループ | 送信元 | 説明 |
|---------|----------------|--------|------|
| `chat:user_joined` | `chat:{roomId}` | Hub | 入室通知 |
| `chat:user_left` | `chat:{roomId}` | Hub | 退室通知 |
| `chat:user_typing` | `chat:{roomId}` | Hub | 入力中通知 |
| `chat:message_received` | `chat:{roomId}` | ChatMessageService | メッセージ受信（後述） |
| `chat:unread_updated` | `organization:{orgId}` | ChatMessageService | 未読バッジ更新通知（後述） |
| `chat:message_read` | `chat:{roomId}` | NotificationService | 既読通知（誰がどのメッセージまで読んだか） |

---

## リアルタイム通知

### メッセージ受信イベント

メッセージが DB に保存されたタイミングで SignalR 通知を送信する。

```typescript
// イベント名
chat:message_received

// Payload
{
  category: 'system' | 'dm' | 'group' | 'ai',  // ChatRoomType から判定
  roomId: number,
  message: {
    id: number,
    senderUserId: number | null,
    messageType: ChatMessageType,
    content: string,
    createdAt: string,  // ISO 8601
    replyToMessageId: number | null,
  }
}
```

### カテゴリ判定

| ChatRoomType | category |
|--------------|----------|
| Dm | `'dm'` |
| Group | `'group'` |
| Ai | `'ai'` |
| System | `'system'` |

### 未読バッジ

- ヘッダーに未読メッセージ数の合計を表示
- `ChatNotificationSetting.Muted` のルームは未読カウントから**除外**
- カテゴリ別の未読数はフロントエンドで `category` を見て集計

### 未読バッジのリアルタイム更新

メッセージ受信時、チャット画面を開いていないユーザーにも未読バッジを更新するため、`chat:unread_updated` イベントを `organization:{organizationId}` グループに送信する。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    未読バッジ更新の流れ                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. ユーザー A がメッセージを送信                                            │
│  2. DB に ChatMessage を INSERT                                             │
│  3. chat:message_received を chat:{roomId} グループに送信                   │
│     → チャット画面を開いているユーザーがメッセージを受信                      │
│  4. chat:unread_updated を organization:{organizationId} グループに送信     │
│     → 組織内の全ユーザーが未読カウントを再取得してバッジを更新               │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### chat:unread_updated イベント

```typescript
// イベント名
chat:unread_updated

// Payload（メッセージ送信時）
{
  roomId: number,           // 更新があったルームID
  roomType: string,         // 'Dm' | 'Group' | 'Ai' | 'System'
  senderUserId: number,     // 送信者のユーザーID（自分自身のメッセージは無視するため）
}

// Payload（既読更新時）
{
  roomId: number,           // 更新があったルームID
  roomType: string,         // 'Dm' | 'Group' | 'Ai' | 'System'
  updatedByUserId: number,  // 既読更新したユーザーID
  updateType: 'read',       // 更新種別
}
```

#### フロントエンド実装

```typescript
// ChatProvider.tsx
useSignalREvent<ChatUnreadUpdatedPayload>('chat:unread_updated', (payload) => {
  // 既読更新の場合は自分自身の更新のみ処理
  if (payload.updateType === 'read') {
    if (payload.updatedByUserId === currentUserId) {
      fetchUnreadCounts();
    }
    return;
  }

  // メッセージ送信の場合は自分が送信したメッセージは無視
  if (payload.senderUserId === currentUserId) return;

  // 未読カウントを再取得してバッジを更新
  fetchUnreadCounts();
});
```

> **Note**: `chat:message_received` はチャット画面を開いているユーザーのみが受信するのに対し、`chat:unread_updated` は組織内の全ユーザーが受信する。これにより、チャット画面を開いていなくてもヘッダーの未読バッジがリアルタイムに更新される。

---

## 既読管理方式

### ウォーターマーク方式（推奨）

「どこまで読んだか」を `ChatRoomMember.LastReadAt` で管理するシンプルな方式を採用。

```
既読ウォーターマーク: メッセージCの送信時刻
┌─────────────────────┐
│ メッセージ A        │ ← 既読
│ メッセージ B        │ ← 既読
│ メッセージ C ───────│ ← 既読（ここまで）
│ メッセージ D        │ ← 未読
│ メッセージ E        │ ← 未読
└─────────────────────┘
```

### 更新タイミング

| タイミング | 処理 |
|-----------|------|
| メッセージが視覚範囲に入った時 | 該当メッセージの `CreatedAt` で `LastReadAt` を更新 |
| 新着メッセージ受信時（画面アクティブ & 視覚範囲内） | `LastReadAt` を更新 |

### 未読カウントの計算

```csharp
// ルームごとの未読メッセージ数を取得
var unreadCount = await _context.ChatMessages
    .Where(m => m.ChatRoomId == roomId)
    .Where(m => m.CreatedAt > member.LastReadAt)
    .CountAsync();
```

### フロントエンド実装例

```typescript
const markAsRead = async (roomId: number, messageCreatedAt: Date) => {
  await updateLastReadAt(roomId, messageCreatedAt);
};

// IntersectionObserver でメッセージが視覚範囲に入ったかを検知
const observeMessage = (messageEl: HTMLElement, message: ChatMessage) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          markAsRead(roomId, message.createdAt);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 } // 50% 以上表示されたら既読
  );
  observer.observe(messageEl);
};

// 新着メッセージ受信時（画面アクティブ & 視覚範囲内なら即座に既読）
onNewMessage((msg) => {
  if (document.hasFocus() && isMessageInViewport(msg)) {
    markAsRead(roomId, msg.createdAt);
  }
});
```

### 補足: メッセージ単位の既読について

MVP ではウォーターマーク方式（`LastReadAt`）のみで運用する。

グループチャットで「誰が読んだか」を表示する要件が発生した場合は、`ChatMessageRead` テーブルの追加を検討する。
ただし、メッセージ数 × ユーザー数のレコードが発生するためパフォーマンスに注意が必要。

---

## ワークスペースグループチャットのライフサイクル管理

### ワークスペース作成時

ワークスペースが作成されると、自動的にワークスペースグループチャットルームが作成される。

```csharp
// WorkspaceService.CreateWorkspaceAsync 内
var workspace = new Workspace { /* ... */ };
await _context.Workspaces.AddAsync(workspace);
await _context.SaveChangesAsync();

// ワークスペースグループチャットルームを作成
await _chatRoomService.GetOrCreateWorkspaceGroupRoomAsync(
    workspace.Id,
    currentUserId  // オーナーとして最初のメンバーになる
);
```

### ワークスペースメンバー追加時

ワークスペースにメンバーが追加されると、自動的にワークスペースグループチャットに参加する。

```csharp
// WorkspaceService.AddUserToWorkspaceAsync 内
await _chatRoomService.AddUserToWorkspaceRoomAsync(userId, workspaceId);
```

### ワークスペースメンバー削除時

ワークスペースからメンバーが削除されると、自動的にワークスペースグループチャットから退出する。

```csharp
// WorkspaceService.RemoveUserFromWorkspaceAsync 内
await _chatRoomService.RemoveUserFromWorkspaceRoomAsync(userId, workspaceId);
```

### ワークスペース削除時

ワークスペースが削除されると、関連するチャットルームは **FK の CASCADE DELETE** により自動削除される。

```csharp
// ApplicationDbContext.OnModelCreating 内
entity.HasOne(cr => cr.Workspace)
    .WithMany()
    .HasForeignKey(cr => cr.WorkspaceId)
    .OnDelete(DeleteBehavior.Cascade);  // ワークスペース削除時に自動削除
```

### API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/chat/rooms/workspace/{workspaceId}/group` | ワークスペースのグループチャットルームを取得（存在しない場合は作成） |

---

## 未検討事項

- [ ] ファイル添付の実装方法
- [ ] メンションの解析・通知
- [ ] メッセージ検索
- [ ] ピン留めメッセージ
- [ ] リアクション（絵文字）
- [ ] AI チャットの実装詳細（セッション管理、コンテキスト保持など）
- [ ] メッセージ編集・削除機能
- [ ] 古いメッセージの定期削除（バッチ処理）

---

## 参考

- SignalR グループ設計: `docs/spec/signalr-implementation.md`
