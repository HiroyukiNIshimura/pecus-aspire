# ChatActor 設計改善の検討

## 現状の課題

ChatActor テーブルは User/Bot の情報をキャッシュとして保持しているが、同期の問題がある。

### 現在のデータ構造

```
User テーブル
├── Username
├── AvatarType
└── UserAvatarPath

ChatActor テーブル（キャッシュ）
├── DisplayName      ← User.Username をコピー
├── AvatarType       ← User.AvatarType をコピー
└── AvatarUrl        ← User.UserAvatarPath をコピー

Bot テーブル
├── Name
└── IconUrl
```

### 問題点

1. **同期漏れのリスク**
   - User 更新時に ChatActor を忘れると不整合が発生
   - 2026-01-16 に `UserService.SyncChatActorAsync` を追加して対応済みだが、新しい更新箇所を追加する際に忘れるリスクは残る

2. **二重管理**
   - 同じ情報を2箇所で持つ（正規化違反）

3. **Bot との非対称性**
   - Bot は直接参照（Bot.Name / Bot.IconUrl）
   - User だけキャッシュを持つ

## 改善案

### 案1: ChatActor をビュー的に使う（推奨）

```csharp
// ChatActor から DisplayName/AvatarUrl を削除
// 必要な時に User/Bot を参照

public class ChatActor
{
    public int Id { get; set; }
    public ChatActorType ActorType { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
    public int? BotId { get; set; }
    public Bot? Bot { get; set; }

    // ヘルパープロパティ（計算）
    public string DisplayName => IsUser ? User?.Username ?? "" : Bot?.Name ?? "";
    public string? AvatarUrl => IsUser ? User?.UserAvatarPath : Bot?.IconUrl;
}
```

**メリット:**
- 同期不要、常に最新
- コードがシンプルになる
- バグのリスクが減る

**デメリット:**
- クエリ時に常に Join が必要（パフォーマンス影響）

### 案2: 非正規化を維持するがイベント駆動で同期

```csharp
// ドメインイベント発行
public class UserUpdatedEvent
{
    public int UserId { get; set; }
    public string Username { get; set; }
    public AvatarType AvatarType { get; set; }
    public string? UserAvatarPath { get; set; }
}

// イベントハンドラーで ChatActor を同期
```

**メリット:**
- パフォーマンス維持
- 同期漏れを防げる

**デメリット:**
- 複雑性増加
- イベント基盤の導入が必要

### 案3: 現状維持

`UserService.SyncChatActorAsync` で同期しているため、当面は問題なし。

**メリット:**
- 追加作業なし

**デメリット:**
- 新しい User 更新箇所を追加する際に同期を忘れるリスクが残る

## 関連ファイル

- `pecus.Libs/DB/Models/ChatActor.cs` - モデル定義
- `pecus.WebApi/Services/UserService.cs` - `SyncChatActorAsync`, `SyncChatActorAvatarAsync`
- `pecus.WebApi/Controllers/ChatController.cs` - `MapToChatUserItemFromActor`

## 履歴

- 2026-01-16: アバター同期漏れバグを修正（`IdentityIconHelper` の URL 修正 + `SyncChatActorAsync` 追加）
- 2026-01-16: 本ドキュメント作成（検討課題として記録）
