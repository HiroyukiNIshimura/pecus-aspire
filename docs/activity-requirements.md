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

| ActionType | 説明 | Details 例 | 記録条件 |
|------------|------|-----------|---------|
| `Created` | アイテム作成 | `null` | 常に記録 |
| `SubjectUpdated` | 件名更新 | `{ "old": "旧件名", "new": "新件名" }` | 変更時のみ |
| `BodyUpdated` | 本文更新 | `{ "old": "旧本文" }` ※newは保存しない | 変更時のみ |
| `FileAdded` | ファイル添付追加 | `{ "fileName": "doc.pdf", "fileSize": 12345 }` | ファイル追加時 |
| `FileRemoved` | ファイル添付削除 | `{ "fileName": "doc.pdf" }` | ファイル削除時 |
| `StatusChanged` | ステータス変更 | `{ "old": "TODO", "new": "DOING" }` | 変更時のみ |
| `AssigneeChanged` | 担当者変更 | `{ "old": 1, "new": 2 }` | 変更時のみ |
| `RelationAdded` | 関係アイテム追加 | `{ "relatedItemId": 123, "relationType": "BLOCKS" }` | 関係追加時 |
| `RelationRemoved` | 関係アイテム削除 | `{ "relatedItemId": 123 }` | 関係削除時 |
| `ArchivedChanged` | アーカイブON/OFF | `{ "old": false, "new": true }` | 変更時のみ |
| `DraftChanged` | 下書きON/OFF | `{ "old": true, "new": false }` | 変更時のみ |
| `CommitterChanged` | コミッタ変更 | `{ "old": 1, "new": 2 }` | 変更時のみ |
| `PriorityChanged` | 重要度変更 | `{ "old": "LOW", "new": "HIGH" }` | 変更時のみ |
| `DueDateChanged` | 期限変更 | `{ "old": "2025-12-01T00:00:00Z", "new": "2025-12-15T00:00:00Z" }` | 変更時のみ |

**変更検出の仕組み:**
- `ActivityTasks.CreateChangeDetails<T>(oldValue, newValue)` が `EqualityComparer<T>.Default` で新旧値を比較
- 本文更新専用の `ActivityTasks.CreateBodyChangeDetails(oldValue, newValue)` は `old` のみを保存（データサイズ削減のため）
- 変更がない場合は `null` を返し、null チェックで Hangfire ジョブのエンキューをスキップ
- `Created` アクションのみ Details が `null` でも記録される

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
変更前スナップショット作成
    ↓
アイテム更新処理
    ↓
変更検出（ActivityTasks.CreateChangeDetails）
    ↓
変更がある場合のみ BackgroundJob.Enqueue<ActivityTasks>(x => x.RecordActivityAsync(...))
    ↓
Hangfire Worker
    ↓
Activity テーブルに INSERT
```

**実装アーキテクチャ:**

1. **ActivityTasks** (`pecus.Libs/Hangfire/Tasks/ActivityTasks.cs`) - Hangfire ジョブ
   - `RecordActivityAsync()`: Hangfireジョブとして実行されるアクティビティ記録メソッド
   - `CreateChangeDetails<T>()`: 新旧値を比較し、変更がある場合のみJSON文字列を返す静的ヘルパー
   - `CreateBodyChangeDetails()`: 本文更新専用。oldのみを保存してデータサイズを削減

2. **ActivityService** (`pecus.WebApi/Services/ActivityService.cs`) - コントローラーサービス層
   - `GetActivitiesByItemIdAsync()`: アイテムIDでアクティビティ取得
   - `GetActivitiesByUserIdAsync()`: ユーザーIDでアクティビティ取得
   - `GetActivitiesByWorkspaceIdAsync()`: ワークスペースIDでアクティビティ取得

3. **WorkspaceItemService での利用パターン** (`pecus.WebApi/Services/WorkspaceItemService.cs`)
   ```csharp
   // スナップショットパターン: 更新前の値を匿名オブジェクトで保持
   var snapshot = new {
       Subject = item.Subject,
       Body = item.Body,
       AssigneeId = item.AssigneeId,
       Priority = item.Priority,
       CommitterId = item.CommitterId,
       IsDraft = item.IsDraft,
       IsArchived = item.IsArchived,
       DueDate = item.DueDate
   };

   // アイテム更新処理
   item.Subject = request.Subject;
   item.Body = request.Body;
   // ... その他の更新 ...
   await _context.SaveChangesAsync();

   // 一括でActivity記録（変更があった項目のみ記録される）
   // 本文更新は別途処理（oldのみ保存してデータサイズ削減）
   var bodyDetails = ActivityTasks.CreateBodyChangeDetails(snapshot.Body, item.Body);
   if (bodyDetails != null)
   {
       _backgroundJobClient.Enqueue<ActivityTasks>(x =>
           x.RecordActivityAsync(workspaceId, itemId, userId, ActivityActionType.BodyUpdated, bodyDetails)
       );
   }

   // その他の項目は通常通り old/new を記録
   RecordItemChanges(workspaceId, itemId, userId,
       (ActivityActionType.SubjectUpdated, snapshot.Subject, item.Subject),
       (ActivityActionType.AssigneeChanged, snapshot.AssigneeId, item.AssigneeId),
       (ActivityActionType.PriorityChanged, snapshot.Priority, item.Priority),
       (ActivityActionType.CommitterChanged, snapshot.CommitterId, item.CommitterId),
       (ActivityActionType.DraftChanged, snapshot.IsDraft, item.IsDraft),
       (ActivityActionType.ArchivedChanged, snapshot.IsArchived, item.IsArchived),
       (ActivityActionType.DueDateChanged, snapshot.DueDate, item.DueDate)
   );

   // RecordItemChanges ヘルパーメソッド（private）
   private void RecordItemChanges(
       int workspaceId, int itemId, int userId,
       params (ActivityActionType ActionType, object? OldValue, object? NewValue)[] changes)
   {
       foreach (var (actionType, oldValue, newValue) in changes)
       {
           var details = ActivityTasks.CreateChangeDetails(oldValue, newValue);
           if (details != null)
           {
               _backgroundJobClient.Enqueue<ActivityTasks>(x =>
                   x.RecordActivityAsync(workspaceId, itemId, userId, actionType, details)
               );
           }
       }
   }
   ```

3. **ファイル操作での利用パターン** (`pecus.WebApi/Controllers/WorkspaceItemAttachmentController.cs`)
   ```csharp
   // ファイル追加時
   var fileAddedDetails = System.Text.Json.JsonSerializer.Serialize(new
   {
       fileName = fileName,
       fileSize = file.Length
   });
   _backgroundJobClient.Enqueue<ActivityTasks>(x =>
       x.RecordActivityAsync(
           workspaceId,
           itemId,
           CurrentUserId,
           ActivityActionType.FileAdded,
           fileAddedDetails
       )
   );

   // ファイル削除時
   var fileRemovedDetails = System.Text.Json.JsonSerializer.Serialize(new
   {
       fileName = attachment.FileName
   });
   _backgroundJobClient.Enqueue<ActivityTasks>(x =>
       x.RecordActivityAsync(
           workspaceId,
           itemId,
           CurrentUserId,
           ActivityActionType.FileRemoved,
           fileRemovedDetails
       )
   );
   ```

4. **関係アイテム操作での利用パターン** (`pecus.WebApi/Services/WorkspaceItemRelationService.cs`)
   ```csharp
   // 関係追加時
   var relationDetails = System.Text.Json.JsonSerializer.Serialize(new
   {
       relatedItemId = request.ToItemId,
       relationType = request.RelationType?.ToString()
   });
   _backgroundJobClient.Enqueue<ActivityService>(x =>
       x.RecordActivityAsync(
           workspaceId,
           fromItemId,
           createdByUserId,
           ActivityActionType.RelationAdded,
           relationDetails
       )
   );

   // 関係削除時
   var relationRemovedDetails = System.Text.Json.JsonSerializer.Serialize(new
   {
       relatedItemId = toItemId,
       relationType = relationType?.ToString()
   });
   _backgroundJobClient.Enqueue<ActivityTasks>(x =>
       x.RecordActivityAsync(
           workspaceId,
           fromItemId,
           currentUserId,
           ActivityActionType.RelationRemoved,
           relationRemovedDetails
       )
   );
   ```

5. **アクティビティ取得API** (`pecus.WebApi/Controllers/ActivityController.cs`)
   - `GET /api/activities/items/{itemId}`: アイテムのタイムライン表示用
   - `GET /api/activities/users/{userId}`: ユーザー活動レポート用
   - `GET /api/activities/workspaces/{workspaceId}`: ワークスペース統計用

   全エンドポイント共通:
   - ページネーション対応（`page`, `pageSize`）
   - 日付範囲フィルタ（`startDate`, `endDate`）
   - ページサイズ上限: 100件

**パフォーマンス特性:**
- 変更検出（`CreateChangeDetails`）: 1-2ms（メモリ内比較＋JSON生成）
- Hangfire エンキュー: 1-3ms（Redis へのジョブ投入）
- 合計オーバーヘッド: 3-5ms（UI をブロックしない範囲）
- Activity の INSERT 自体は非同期で実行されるため、メインリクエストには影響なし

## 削除した項目（現行 Activity.cs から）

| 項目 | 削除理由 |
|------|---------|
| `Action` | `ActionType`（enum）に統一 |
| `ActionCategory` | 不要。ActionType から分類可能 |
| `BeforeData` / `AfterData` | 監査向け。`Details` に必要な差分だけ保持 |
| `Metadata` | 監査向け（IP等）。今回は不要 |
| `IsSystem` | `UserId = NULL` で判断可能 |

## インデックス設計

パフォーマンスを考慮し、以下のインデックスを設定済み（`ApplicationDbContext.cs` で定義）:

**単一カラムインデックス:**
- `ActionType`: アクション種別での絞り込み
- `CreatedAt`: 時系列での並び替え
- `ItemId`: アイテム単位での取得
- `UserId`: ユーザー単位での取得
- `WorkspaceId`: ワークスペース単位での取得

**複合インデックス（カバリングインデックス）:**
- `(ItemId, CreatedAt)`: アイテムのタイムライン表示に最適化
- `(UserId, CreatedAt)`: ユーザーアクティビティレポートに最適化
- `(WorkspaceId, CreatedAt)`: ワークスペース全体の統計に最適化

## 未決事項

- [x] 本文更新時のデータサイズ問題 → `old` のみ保存に変更（`new` は Item.Body から取得可能）
- [x] ファイル操作のActivity記録（`FileAdded`, `FileRemoved`） → `WorkspaceItemAttachmentController` に実装済み
- [x] 関係アイテム操作のActivity記録（`RelationAdded`, `RelationRemoved`） → `WorkspaceItemRelationService` に実装済み
- [x] アクティビティ取得APIエンドポイントの実装（タイムライン表示用） → `ActivityController` に実装済み
- [ ] 具体的なUI/UX設計

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
