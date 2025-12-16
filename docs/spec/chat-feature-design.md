# チャット機能設計

## 概要

組織内のユーザー間コミュニケーションを実現するチャット機能の設計ドキュメントです。
1:1 DM、グループチャット、AI アシスタントとの会話を統一的に管理します。

## ユースケース

| ユースケース | 説明 |
|-------------|------|
| ユーザーと AI アシスタント | AI との対話セッション |
| ユーザー A とユーザー B の 1:1 DM | ダイレクトメッセージ |
| グループチャット | 3人以上のチャットルーム |

※ ワークスペース全体のチャットは `workspace:{workspaceId}` グループで対応可能

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
│ DmUserPair      │       │ JoinedAt            │              │
│ CreatedByUserId │       │ LastReadAt          │              │
│ CreatedAt       │       └─────────────────────┘              │
│ UpdatedAt       │                                            │
└─────────────────┘                                            │
        │                                                      │
        │ 1:N                                                  │
        ▼                                                      │
┌─────────────────┐       ┌─────────────────────┐              │
│   ChatMessage   │       │  ChatMessageRead    │              │
├─────────────────┤       ├─────────────────────┤              │
│ Id (PK)         │──────>│ ChatMessageId (FK)  │              │
│ ChatRoomId (FK) │       │ UserId (FK)         │──────────────┘
│ SenderUserId    │       │ ReadAt              │
│ MessageType     │       └─────────────────────┘
│ Content         │
│ CreatedAt       │
│ UpdatedAt       │
│ IsDeleted       │
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
    /// グループチャット（3人以上可）
    /// </summary>
    Group = 1,

    /// <summary>
    /// AI アシスタントとのチャット（メンバー1人 + AI）
    /// </summary>
    Ai = 2,
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
    /// 送信者ユーザーID（AI の場合は null）
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
    /// 編集日時
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// 削除フラグ（論理削除）
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// 返信先メッセージID（スレッド返信の場合）
    /// </summary>
    public int? ReplyToMessageId { get; set; }
    public ChatMessage? ReplyToMessage { get; set; }

    // Navigation Properties
    public ICollection<ChatMessageRead> ReadBy { get; set; } = new List<ChatMessageRead>();
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
    /// システムメッセージ（参加/退出通知など）
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

### ChatMessageRead（メッセージ既読）

メッセージごとの既読状態を管理する中間テーブル。

```csharp
public class ChatMessageRead
{
    /// <summary>
    /// メッセージID
    /// </summary>
    public int ChatMessageId { get; set; }
    public ChatMessage ChatMessage { get; set; } = null!;

    /// <summary>
    /// 既読したユーザーID
    /// </summary>
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>
    /// 既読日時
    /// </summary>
    public DateTimeOffset ReadAt { get; set; } = DateTimeOffset.UtcNow;
}
```

> **Note**: 主キーは `(ChatMessageId, UserId)` の複合キー

---

## インデックス設計

### ChatRoom

```csharp
// DM の重複防止（同じ2人のDMは1つのみ）
entity.HasIndex(e => new { e.OrganizationId, e.DmUserPair })
    .IsUnique()
    .HasFilter("\"Type\" = 0");  // Dm タイプのみ

// 組織内のチャットルーム一覧取得用
entity.HasIndex(e => e.OrganizationId);
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

// 未読メッセージ取得用
entity.HasIndex(e => new { e.ChatRoomId, e.CreatedAt, e.IsDeleted });
```

### ChatMessageRead

```csharp
// 複合主キー
entity.HasKey(e => new { e.ChatMessageId, e.UserId });

// ユーザーの既読メッセージ取得用
entity.HasIndex(e => e.UserId);

// メッセージの既読者一覧取得用（外部キーで自動作成されるが明示）
entity.HasIndex(e => e.ChatMessageId);
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
```

---

## SignalR グループ

チャット機能では以下のグループを使用：

```
chat:{chatRoomId}
```

### 参加/離脱タイミング

| タイミング | 処理 |
|-----------|------|
| チャット画面を開いた | `JoinChat(chatRoomId)` でグループ参加 + 入室通知 |
| チャット画面を閉じた | `LeaveChat(chatRoomId)` でグループ離脱 + 退室通知 |
| 切断時 | SignalR が自動でグループ離脱 |

### 通知イベント

| イベント | 送信元 | 説明 |
|---------|--------|------|
| `chat:user_joined` | Hub | 入室通知 |
| `chat:user_left` | Hub | 退室通知 |
| `chat:user_typing` | Hub | 入力中通知 |
| `chat:message_sent` | NotificationService | メッセージ送信 |
| `chat:message_read` | NotificationService | 既読通知（誰がどのメッセージまで読んだか） |

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
| チャット画面フォーカス時 | 最新メッセージの時刻で `LastReadAt` を更新 |
| 新着メッセージ受信時（画面アクティブ & 最下部表示中） | `LastReadAt` を更新 |
| スクロールが最下部に到達 | `LastReadAt` を更新 |

### 未読カウントの計算

```csharp
// ルームごとの未読メッセージ数を取得
var unreadCount = await _context.ChatMessages
    .Where(m => m.ChatRoomId == roomId)
    .Where(m => m.CreatedAt > member.LastReadAt)
    .Where(m => !m.IsDeleted)
    .CountAsync();
```

### フロントエンド実装例

```typescript
const markAsRead = async (roomId: number) => {
  await updateLastReadAt(roomId, new Date());
};

// チャット画面フォーカス時
useEffect(() => {
  if (isFocused && messages.length > 0) {
    markAsRead(roomId);
  }
}, [isFocused]);

// スクロールが最下部に到達時
const handleScrollToBottom = () => {
  markAsRead(roomId);
};

// 新着メッセージ受信時（画面アクティブなら）
onNewMessage((msg) => {
  if (document.hasFocus() && isScrolledToBottom) {
    markAsRead(roomId);
  }
});
```

### 補足: メッセージ単位の既読（オプション）

グループチャットで「誰が読んだか」を表示したい場合は `ChatMessageRead` テーブルを使用。
ただし、メッセージ数 × ユーザー数のレコードが発生するためパフォーマンスに注意。

基本はウォーターマーク方式（`LastReadAt`）で運用し、必要に応じて個別既読を追加する。

---

## API エンドポイント（案）

### チャットルーム

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/chat/rooms` | 自分が参加しているルーム一覧 |
| POST | `/api/chat/rooms` | グループチャットルーム作成 |
| POST | `/api/chat/rooms/dm/{userId}` | DM ルーム取得または作成 |
| GET | `/api/chat/rooms/{roomId}` | ルーム詳細取得 |
| PUT | `/api/chat/rooms/{roomId}` | ルーム設定更新 |
| DELETE | `/api/chat/rooms/{roomId}` | ルーム削除（Owner のみ） |

### メンバー管理

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/chat/rooms/{roomId}/members` | メンバー追加（Admin 以上） |
| DELETE | `/api/chat/rooms/{roomId}/members/{userId}` | メンバー削除 |
| PUT | `/api/chat/rooms/{roomId}/members/{userId}/role` | 役割変更（Owner のみ） |

### メッセージ

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/chat/rooms/{roomId}/messages` | メッセージ一覧（ページング） |
| POST | `/api/chat/rooms/{roomId}/messages` | メッセージ送信 |
| PUT | `/api/chat/rooms/{roomId}/messages/{messageId}` | メッセージ編集 |
| DELETE | `/api/chat/rooms/{roomId}/messages/{messageId}` | メッセージ削除（論理削除） |
| POST | `/api/chat/rooms/{roomId}/read` | 既読マーク更新 |

---

## 未検討事項

- [ ] ファイル添付の実装方法
- [ ] メンションの解析・通知
- [ ] メッセージ検索
- [ ] ピン留めメッセージ
- [ ] リアクション（絵文字）
- [ ] AI チャットの実装詳細（セッション管理、コンテキスト保持など）

---

## 参考

- SignalR グループ設計: `docs/spec/signalr-implementation.md`
