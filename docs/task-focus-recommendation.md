# タスクフォーカス推奨機能 設計書

## 概要

タスクが多くなりパニックに陥りがちなユーザーに対し、**「今、何から手をつけるべきか」** を提示する機能。
優先度・期限・先行タスクを解析し、最適な着手順序を推奨する。

## 関連ドキュメント

- [ワークスペース・アイテム・タスクの関係](workspace-item-task-relationship.md) - エンティティの基本構造
- [ダッシュボード統計機能](dashboard-statistics.md) - 同じデータソースを使用
- [アクティビティ要件定義](activity-requirements.md) - 設計理念を共有

## 設計理念

```
❌ 従来のタスク管理
「全部やれ」「優先度高いのからやれ」→ 結局つまみ食いして破綻

✅ このアプリの考え方
「今これをやれば、次も進む」を示す → 連鎖的にタスクが消化される
```

**人間はタスクが多いとパニックになる動物**。
この機能は「考えなくていい」状態を作り、フロー状態への誘導を目指す。

---

## データソース

| エンティティ | フィールド | 用途 |
|-------------|-----------|------|
| **WorkspaceTask** | `Priority` | 重要度スコア |
| **WorkspaceTask** | `DueDate` | 緊急度スコア |
| **WorkspaceTask** | `AssignedUserId` | 自分のタスクのみ抽出 |
| **WorkspaceTask** | `IsCompleted`, `IsDiscarded` | 対象外フィルタ |
| **WorkspaceTask** | `EstimatedHours` | 見積もり時間（既存） |
| **WorkspaceTask** | `ProgressPercentage` | 進捗率（既存） |
| **WorkspaceTask** | `PredecessorTaskId` | **先行タスク（新規追加）** |

---

## 先行タスク設計

### なぜ「先行タスク」か

WorkspaceTask は **一人の担当者が順番にこなすタスク**。

```
A → B → C と順番にやる
     ↓
先行タスクは常に1つで十分
```

複数の先行タスクが必要なケース（A と B 両方終わらないと C が始められない）は、
**チーム間の調整** であり、個人のタスク管理ではない。

### フィールド追加

```csharp
public class WorkspaceTask
{
    // 既存フィールド...

    /// <summary>
    /// 先行タスクID（このタスクが完了しないと着手できない）
    /// </summary>
    public int? PredecessorTaskId { get; set; }

    /// <summary>
    /// 先行タスク
    /// </summary>
    [ForeignKey(nameof(PredecessorTaskId))]
    public WorkspaceTask? PredecessorTask { get; set; }

    /// <summary>
    /// このタスクを先行タスクとしている後続タスク
    /// </summary>
    public ICollection<WorkspaceTask> SuccessorTasks { get; set; } = new List<WorkspaceTask>();
}
```

### インデックス設計

```csharp
// ApplicationDbContext.cs
modelBuilder.Entity<WorkspaceTask>(entity =>
{
    // 先行タスクで「このタスクを待っているタスク一覧」を高速検索
    entity.HasIndex(e => e.PredecessorTaskId);

    // 自己参照の外部キー
    entity.HasOne(e => e.PredecessorTask)
          .WithMany(e => e.SuccessorTasks)
          .HasForeignKey(e => e.PredecessorTaskId)
          .OnDelete(DeleteBehavior.SetNull);  // 先行タスク削除時はNULLに

    // 循環参照防止: PredecessorTaskId != Id
    entity.HasCheckConstraint("CK_WorkspaceTask_NoSelfReference",
        "\"PredecessorTaskId\" != \"Id\"");
});
```

### UI イメージ

```
┌─ タスク作成 ─────────────────────────────┐
│ 件名: フロントエンド実装                  │
│ 優先度: [High ▼]                         │
│ 期限: [2025-12-20]                       │
│                                          │
│ 先行タスク: [PROJ-42 API設計書作成 ▼]    │
│                                          │
│ ※ 先行タスクが完了するまで着手できません  │
└──────────────────────────────────────────┘
```

### クエリ

```sql
-- このタスクの先行タスク（何が終わってないと始められないか）
SELECT p.* FROM WorkspaceTasks t
JOIN WorkspaceTasks p ON t.PredecessorTaskId = p.Id
WHERE t.Id = @taskId

-- このタスクを待っている後続タスク一覧
SELECT * FROM WorkspaceTasks
WHERE PredecessorTaskId = @taskId AND IsCompleted = false

-- 先行タスクが未完了のタスク（着手不可）
SELECT * FROM WorkspaceTasks t
JOIN WorkspaceTasks p ON t.PredecessorTaskId = p.Id
WHERE t.AssignedUserId = @userId
  AND t.IsCompleted = false
  AND p.IsCompleted = false
```

### 循環検出

```csharp
// 先行タスク設定時に循環をチェック
public async Task<bool> HasCircularDependency(int taskId, int predecessorId)
{
    var currentId = predecessorId;
    var visited = new HashSet<int> { taskId };

    while (currentId != null)
    {
        if (visited.Contains(currentId.Value))
            return true;  // 循環検出

        visited.Add(currentId.Value);
        var task = await _context.WorkspaceTasks.FindAsync(currentId);
        currentId = task?.PredecessorTaskId;
    }

    return false;
}

---

## スコアリングアルゴリズム

### 基本スコア計算

```
総合スコア = (優先度スコア × 重み) + (期限スコア × 重み) + (ブロック影響スコア × 重み)
```

### 優先度スコア（Priority Score）

| Priority | スコア |
|----------|-------|
| Critical | 4 |
| High | 3 |
| Medium | 2 |
| Low | 1 |
| NULL | 1 |

**重み: ×2**

### 期限スコア（Deadline Score）

| 条件 | スコア |
|------|-------|
| 期限切れ | 10 |
| 今日 | 8 |
| 明日 | 6 |
| 2-3日後 | 4 |
| 今週中 | 3 |
| 来週 | 2 |
| それ以降 or NULL | 1 |

**重み: ×3**（期限は優先度より重要）

### 後続タスク影響スコア（Successor Impact Score）

このタスクを先行タスクとしている後続タスクの数。

```sql
SELECT COUNT(*)
FROM WorkspaceTasks
WHERE PredecessorTaskId = @taskId AND IsCompleted = false
```

| 後続タスク数 | スコア |
|-------------|-------|
| 3以上 | 10 |
| 2 | 6 |
| 1 | 3 |
| 0 | 0 |

**重み: ×5**（最も重要。これが詰まると連鎖的に止まる）

### スコア計算例

```
タスクA: Priority=High(3), 期限=明日(6), 後続タスク数=2(6)
スコア = (3×2) + (6×3) + (6×5) = 6 + 18 + 30 = 54

タスクB: Priority=Critical(4), 期限=来週(2), 後続タスク数=0(0)
スコア = (4×2) + (2×3) + (0×5) = 8 + 6 + 0 = 14

→ タスクAを先にやるべき
```

---

## 着手可否の判定

### 先行タスクの完了チェック

```sql
-- このタスクの先行タスクが未完了か
SELECT EXISTS (
  SELECT 1 FROM WorkspaceTasks t
  JOIN WorkspaceTasks p ON t.PredecessorTaskId = p.Id
  WHERE t.Id = @taskId
    AND p.IsCompleted = false  -- 先行タスクが未完了
)
```

```sql
-- このタスクを待っている後続タスク一覧
SELECT * FROM WorkspaceTasks
WHERE PredecessorTaskId = @taskId
  AND IsCompleted = false
```

- **先行タスク未完了**: 推奨リストには表示するが「今は着手不可」として分離
- **先行タスクなし or 完了済み**: 即時着手可能

このチェック（先行タスクが完了しないと次を開始できない）は組織設定でON／OFFを持たせガチガチ制限にしないようにする。

---

## UI/UX 設計

### フォーカスビュー

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 今日のフォーカス                            [更新] [設定]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ 今すぐ取り組むべき ─────────────────────────────────────┐  │
│  │                                                          │  │
│  │  1️⃣ [PROJ-42] API設計書作成                              │  │
│  │     📅 今日まで  🔴 Critical  🔗 3タスクがこれを待機中    │  │
│  │     ─────────────────────────────────────────────────    │  │
│  │     💡 これを完了すると PROJ-60, 61, 62 が着手可能に      │  │
│  │                                                          │  │
│  │  2️⃣ [PROJ-55] DBマイグレーション                         │  │
│  │     📅 明日まで  🟠 High  🔗 1タスクがこれを待機中        │  │
│  │                                                          │  │
│  │  3️⃣ [PROJ-38] テストケース作成                           │  │
│  │     📅 12/15まで  🟡 Medium                               │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 今は着手できない（先行タスク待ち）────────────────────┐  │
│  │                                                          │  │
│  │  ⏸️ [PROJ-60] フロント実装                                │  │
│  │     ← 先行: PROJ-42「API設計書作成」                      │  │
│  │                                                          │  │
│  │  ⏸️ [PROJ-61] 結合テスト                                  │  │
│  │     ← 先行: PROJ-55「DBマイグレーション」                 │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 表示ロジック

1. **今すぐ取り組むべき**: 先行タスクなし or 先行タスク完了済み + スコア上位5件
2. **今は着手できない**: 先行タスクが未完了（先行タスクを明示）
3. **対象外**: 完了済み、破棄済み、他ユーザー担当

---

## 見積もり・進捗の活用

WorkspaceTask には既に `EstimatedHours`、`ProgressPercentage` があるため、
追加実装なしでスコアリングに組み込める。

### 拡張スコアリング

```
残り作業量 = EstimatedHours × (1 - ProgressPercentage / 100)

// 小さいタスクを優先（すぐ終わる = 達成感 → モチベーション維持）
サイズスコア = 10 / (残り作業量 + 1)
```

### 分割推奨

```
if (EstimatedHours > 8) {
  警告: "このタスクは大きすぎます。分割を検討してください"
}
```

---

## API エンドポイント案

```
GET /api/focus/me
  → 自分の推奨タスクリスト

GET /api/focus/me/blocked
  → 自分のブロック中タスクリスト

GET /api/focus/workspaces/{workspaceId}
  → ワークスペース全体のクリティカルパス
```

### レスポンス例

```json
{
  "focusTasks": [
    {
      "id": 42,
      "workspaceItemCode": "PROJ-42",
      "content": "API設計書作成",
      "priority": "Critical",
      "dueDate": "2025-12-11",
      "score": 54,
      "successorCount": 3,
      "predecessorTask": null
    }
  ],
  "waitingTasks": [
    {
      "id": 60,
      "workspaceItemCode": "PROJ-60",
      "content": "フロント実装",
      "predecessorTask": {
        "id": 42,
        "workspaceItemCode": "PROJ-42",
        "content": "API設計書作成"
      }
    }
  ]
}
```

---

## 実装優先度案

### Phase 1: MVP

1. WorkspaceTask に `PredecessorTaskId` フィールド追加（マイグレーション）
2. タスク作成・更新時に先行タスクを設定できるように API 更新
3. 循環検出ロジック
4. 基本スコアリング（優先度 + 期限）
5. `/api/focus/me` エンドポイント

### Phase 2: UI/UX

1. タスク作成画面に先行タスク選択 UI
2. フォーカスビュー（今すぐ着手可能 / 待機中）
3. 後続タスク数をスコアに反映
4. 「これを終わらせると N 件が着手可能」の表示

### Phase 3: 見積もり・進捗活用

1. 残り作業量によるスコア調整
2. 大きすぎるタスクの分割推奨

---

## 未決事項

- [ ] WorkspaceTask に PredecessorTaskId フィールド追加（マイグレーション）
- [ ] 先行タスク選択 UI（タスク作成・編集画面）
- [ ] スコアリングの重み調整（ユーザーテスト後に調整）
- [ ] 個人設定の可否（「期限より優先度重視」等のカスタマイズ）
- [ ] 通知連携（「そろそろ PROJ-42 に戻りましょう」等）
- [ ] AI による推奨理由の説明（将来検討）
