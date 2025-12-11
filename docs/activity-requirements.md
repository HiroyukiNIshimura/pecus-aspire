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

### 🚧 TODO: タスク関連アクション

タスクはアイテムに紐づくため、ファイル添付と同様にアイテムへの操作として記録する。

| ActionType | 説明 | Details 例 | 記録条件 |
|------------|------|-----------|---------|
| `TaskAdded` | タスク追加 | `{ "taskId": 1, "content": "スクリーンショット撮影", "assignee": "田中" }` | タスク作成時 |
| `TaskCompleted` | タスク完了 | `{ "taskId": 1, "content": "スクリーンショット撮影", "assignee": "田中", "completedBy": "鈴木" }` | IsCompleted = true 時 |
| `TaskDiscarded` | タスク破棄 | `{ "taskId": 1, "content": "スクリーンショット撮影", "assignee": "田中", "discardedBy": "鈴木" }` | IsDiscarded = true 時 |

※ `completedBy` / `discardedBy` は操作したユーザー。担当者本人の場合もあればコミッターの場合もある。

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

## ActionType Enum

```csharp
public enum ActivityActionType
{
    Created,
    SubjectUpdated,
    BodyUpdated,
    FileAdded,
    FileRemoved,
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
変更前スナップショット作成（ユーザー名を含む）
    ↓
アイテム更新処理
    ↓
変更検出（ActivityDetailsBuilder で型安全にJSON生成）
    ↓
変更がある場合のみ BackgroundJob.Enqueue<ActivityTasks>(x => x.RecordActivityAsync(...))
    ↓
Hangfire Worker
    ↓
Activity テーブルに INSERT
```

**実装アーキテクチャ:**

1. **ActivityDetailsBuilder** (`pecus.Libs/ActivityDetailsBuilder.cs`) - 型安全なJSON生成ヘルパー
   - `BuildUserChangeDetails()`: ユーザー名（担当者・コミッター）の変更用
   - `BuildPriorityChangeDetails()`: 優先度の変更用（日本語ラベル付き）
   - `BuildStringChangeDetails()`: 文字列の変更用
   - `BuildBodyChangeDetails()`: 本文更新用（oldのみ保存）
   - `BuildBoolChangeDetails()`: bool値の変更用
   - `BuildDateTimeChangeDetails()`: 日時の変更用
   - `BuildFileAddedDetails()`: ファイル追加用
   - `BuildFileRemovedDetails()`: ファイル削除用
   - `BuildRelationAddedDetails()`: 関連追加用（アイテムコード付き）
   - `BuildRelationRemovedDetails()`: 関連削除用（アイテムコード付き）

2. **ActivityTasks** (`pecus.Libs/Hangfire/Tasks/ActivityTasks.cs`) - Hangfire ジョブ
   - `RecordActivityAsync()`: Hangfireジョブとして実行されるアクティビティ記録メソッド
   - **責務: DBへのINSERTのみ**（変更検出やJSON生成は行わない）

3. **ActivityService** (`pecus.WebApi/Services/ActivityService.cs`) - コントローラーサービス層
   - `GetActivitiesByItemIdAsync()`: アイテムIDでアクティビティ取得
   - `GetActivitiesByUserIdAsync()`: ユーザーIDでアクティビティ取得
   - `GetActivitiesByWorkspaceIdAsync()`: ワークスペースIDでアクティビティ取得

4. **WorkspaceItemService での利用パターン** (`pecus.WebApi/Services/WorkspaceItemService.cs`)
   ```csharp
   // スナップショットパターン: 更新前の値を匿名オブジェクトで保持（ユーザー名を含む）
   var item = await _context.WorkspaceItems
       .Include(wi => wi.Assignee)
       .Include(wi => wi.Committer)
       .FirstOrDefaultAsync(wi => wi.WorkspaceId == workspaceId && wi.Id == itemId);

   var snapshot = new {
       Subject = item.Subject,
       Body = item.Body,
       AssigneeId = item.AssigneeId,
       AssigneeName = item.Assignee?.Username,  // UI表示用にユーザー名も保持
       Priority = item.Priority,
       CommitterId = item.CommitterId,
       CommitterName = item.Committer?.Username,
       IsDraft = item.IsDraft,
       IsArchived = item.IsArchived,
       DueDate = item.DueDate
   };

   // アイテム更新処理
   item.Subject = request.Subject;
   item.Body = request.Body;
   // ... その他の更新 ...
   await _context.SaveChangesAsync();

   // Activity記録（変更があった場合のみ、型安全なビルダーを使用）
   EnqueueActivityIfChanged(workspaceId, itemId, userId,
       ActivityActionType.BodyUpdated,
       ActivityDetailsBuilder.BuildBodyChangeDetails(snapshot.Body, item.Body));

   EnqueueActivityIfChanged(workspaceId, itemId, userId,
       ActivityActionType.SubjectUpdated,
       ActivityDetailsBuilder.BuildStringChangeDetails(snapshot.Subject, item.Subject));

   // 担当者変更: ユーザー名を取得してから記録
   if (snapshot.AssigneeId != item.AssigneeId)
   {
       string? newAssigneeName = null;
       if (item.AssigneeId.HasValue)
       {
           var assignee = await _context.Users.FindAsync(item.AssigneeId.Value);
           newAssigneeName = assignee?.Username;
       }
       EnqueueActivityIfChanged(workspaceId, itemId, userId,
           ActivityActionType.AssigneeChanged,
           ActivityDetailsBuilder.BuildUserChangeDetails(snapshot.AssigneeName, newAssigneeName));
   }

   EnqueueActivityIfChanged(workspaceId, itemId, userId,
       ActivityActionType.PriorityChanged,
       ActivityDetailsBuilder.BuildPriorityChangeDetails(snapshot.Priority, item.Priority));

   EnqueueActivityIfChanged(workspaceId, itemId, userId,
       ActivityActionType.DueDateChanged,
       ActivityDetailsBuilder.BuildDateTimeChangeDetails(snapshot.DueDate, item.DueDate));

   // EnqueueActivityIfChanged ヘルパーメソッド（private）
   private void EnqueueActivityIfChanged(
       int workspaceId,
       int itemId,
       int userId,
       ActivityActionType actionType,
       string? details)
   {
       if (details == null) return;

       _backgroundJobClient.Enqueue<ActivityTasks>(x =>
           x.RecordActivityAsync(workspaceId, itemId, userId, actionType, details)
       );
   }
   ```

5. **ファイル操作での利用パターン** (`pecus.WebApi/Controllers/WorkspaceItemAttachmentController.cs`)
   ```csharp
   // ファイル追加時
   var fileAddedDetails = ActivityDetailsBuilder.BuildFileAddedDetails(fileName, file.Length);
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
   var fileRemovedDetails = ActivityDetailsBuilder.BuildFileRemovedDetails(attachment.FileName);
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

6. **関係アイテム操作での利用パターン** (`pecus.WebApi/Services/WorkspaceItemRelationService.cs`)
   ```csharp
   // 関係追加時（アイテムコードを含める）
   var relationDetails = ActivityDetailsBuilder.BuildRelationAddedDetails(
       toItem.Code,
       request.RelationType?.ToString()
   );
   _backgroundJobClient.Enqueue<ActivityTasks>(x =>
       x.RecordActivityAsync(
           workspaceId,
           fromItemId,
           createdByUserId,
           ActivityActionType.RelationAdded,
           relationDetails
       )
   );

   // 関係削除時
   var relationRemovedDetails = ActivityDetailsBuilder.BuildRelationRemovedDetails(
       toItemCode,
       relationType?.ToString()
   );
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

7. **アクティビティ取得API** (`pecus.WebApi/Controllers/ActivityController.cs`)
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
- [x] 具体的なUI/UX設計
- [x] バックエンドでアクティビティを作成する場合、old/newの値がIdやコード値になってしまっている。
- [ ] 本文を変更した場合のUI側での見せ方
- [ ] その他、変更内容詳細のUI側での見せ方

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

---

## 関連ドキュメント

- [ワークスペース・アイテム・タスクの関係](workspace-item-task-relationship.md) - エンティティの基本構造
- [ダッシュボード統計機能](dashboard-statistics.md) - アクティビティを使った統計
- [タスクフォーカス推奨機能](task-focus-recommendation.md) - 設計理念を共有