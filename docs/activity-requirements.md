# アクティビティ機能 要件定義

## 概要

アイテムに対する操作履歴を記録する機能。監査目的ではなく、分析・集計・タイムライン表示を目的とする。

## 目的・ユースケース

| ユースケース | 説明 |
|-------------|------|
| **アイテムのタイムライン表示** | 特定アイテムに「何が起きたか」を時系列で表示 |
| **ユーザー活動レポート** | ユーザーごとに今日/今週/今月の作業内容を表示 |
| **統計集計元** | タスク消化率などの分析データとして利用 |

## 対象外

- タスクの作成・開始・終了時間（タスクエンティティから直接取得可能）
- 監査ログ（IP、UserAgent等の記録は不要）

## 記録対象のアクション

アイテムに対する操作のみを記録する。

| ActionType | 説明 | Details 例 |
|------------|------|-----------|
| `Created` | アイテム作成 | `{}` |
| `SubjectUpdated` | 件名更新 | `{ "subject": "新しい件名" }` |
| `BodyUpdated` | 本文更新 | `{}`（差分なし、更新事実のみ） |
| `FileAdded` | ファイル添付追加 | `{ "fileName": "doc.pdf", "fileSize": 12345 }` |
| `FileRemoved` | ファイル添付削除 | `{ "fileName": "doc.pdf" }` |
| `StatusChanged` | ステータス変更 | `{ "from": "TODO", "to": "DOING" }` |
| `AssigneeChanged` | 担当者変更 | `{ "fromUserId": 1, "toUserId": 2 }` |
| `RelationAdded` | 関係アイテム追加 | `{ "relatedItemId": 123, "relationType": "BLOCKS" }` |
| `RelationRemoved` | 関係アイテム削除 | `{ "relatedItemId": 123 }` |
| `ArchivedChanged` | アーカイブON/OFF | `{ "archived": true }` |
| `DraftChanged` | 下書きON/OFF | `{ "draft": false }` |
| `CommitterChanged` | コミッタ変更 | `{ "fromUserId": 1, "toUserId": 2 }` |
| `PriorityChanged` | 重要度変更 | `{ "from": "LOW", "to": "HIGH" }` |
| `DueDateChanged` | 期限変更 | `{ "from": "2025-12-01T00:00:00Z", "to": "2025-12-15T00:00:00Z" }` |

## テーブル設計（案）

```csharp
public class Activity
{
    [Key]
    public long Id { get; set; }

    [Required]
    public int WorkspaceId { get; set; }

    [Required]
    public int ItemId { get; set; }

    /// <summary>
    /// 操作したユーザーID（NULL = システム操作）
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// 操作タイプ（enum）
    /// </summary>
    [Required]
    public ActivityActionType ActionType { get; set; }

    /// <summary>
    /// 操作の詳細データ（jsonb形式）
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? Details { get; set; }

    [Required]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation Properties
    public Workspace? Workspace { get; set; }
    public WorkspaceItem? Item { get; set; }
    public User? User { get; set; }

    public uint RowVersion { get; set; }
}
```

## ActionType Enum（案）

```csharp
public enum ActivityActionType
{
    Created,
    SubjectUpdated,
    BodyUpdated,
    FileAdded,
    FileRemoved,
    StatusChanged,
    AssigneeChanged,
    RelationAdded,
    RelationRemoved,
    ArchivedChanged,
    DraftChanged,
    CommitterChanged,
    PriorityChanged,
    DueDateChanged
}
```

## SignalR通知との関係

- **アクティビティ記録とSignalR通知は完全に分離**
- アクティビティはHangfireジョブで非同期記録（遅延あり）
- SignalR通知は即時性が必要なため、サービス層で直接送信
- イベントタイプを共通化する必要はない

```
サービス層（アイテム更新など）
    ├─→ SignalR 通知送信（即時）
    └─→ Hangfire ジョブ投入（非同期でアクティビティ記録）
```

## アクティビティ記録の実装方針

### Hangfireジョブで非同期記録

アクティビティの作成はHangfireジョブとして実行する。

**理由:**
- メイン処理のレスポンスタイムに影響を与えない
- 失敗時のリトライが可能
- 大量の操作があっても負荷分散できる

**フロー:**
```
サービス層（アイテム更新など）
    ↓
BackgroundJob.Enqueue<IActivityService>(x => x.RecordActivityAsync(...))
    ↓
Hangfire Worker
    ↓
Activity テーブルに INSERT
    ↓
（必要に応じて）SignalR 通知送信
```

**実装例:**
```csharp
// サービス層での呼び出し
public async Task<WorkspaceItem> UpdateItemStatusAsync(int itemId, string newStatus, int userId)
{
    var item = await _context.WorkspaceItems.FindAsync(itemId);
    var oldStatus = item.Status;
    item.Status = newStatus;
    await _context.SaveChangesAsync();

    // アクティビティ記録はHangfireジョブで非同期実行
    BackgroundJob.Enqueue<IActivityService>(x => x.RecordActivityAsync(
        item.WorkspaceId,
        itemId,
        userId,
        ActivityActionType.StatusChanged,
        JsonSerializer.Serialize(new { from = oldStatus, to = newStatus })
    ));

    return item;
}
```

## 削除した項目（現行 Activity.cs から）

| 項目 | 削除理由 |
|------|---------|
| `Action` | `ActionType`（enum）に統一 |
| `ActionCategory` | 不要。ActionType から分類可能 |
| `BeforeData` / `AfterData` | 監査向け。`Details` に必要な差分だけ保持 |
| `Metadata` | 監査向け（IP等）。今回は不要 |
| `IsSystem` | `UserId = NULL` で判断可能 |

## 未決事項

- [ ] 本文更新時の差分表示（エディタがNode形式のため技術的に困難）
- [ ] 具体的なUI/UX設計
- [ ] パフォーマンス考慮（大量データ時のインデックス設計）

## 設計理念

**アクティビティはユーザーを監視するためのものではない。**

- 寝ていようが酒を飲んでいようが、タスクが進めばそれでいい
- 「誰が何時間働いたか」ではなく「タスクに何が起きたか」を記録する
- ユーザー活動レポートは監視ではなく、本人が「今週何やったっけ？」を振り返るためのもの

```
❌ 従来の管理思想
「誰が何時間働いたか」「何回操作したか」を監視

✅ このアプリの考え方
「タスクが進んだか」「成果物が出たか」だけが重要
```

Hangfireがジョブを処理していくように、人間がタスクを処理していく。
ワーカーがいつ起きてたかではなく、ジョブが完了したかどうかだけを見る。
