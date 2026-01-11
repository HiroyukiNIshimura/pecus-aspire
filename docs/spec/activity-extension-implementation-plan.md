# Activity拡張 実装計画

最終更新: 2026-01-11

## AI エージェント向け要約（必読）

- **目的**: ゲーミフィケーション（実績バッジ）のために Activity テーブルに新しい ActionType を追加
- **追加する ActionType**: `TaskAssigneeChanged`, `TaskReopened`, `TaskDueDateChanged`
- **修正ファイル**: 4ファイル（Enum, DetailsBuilder, TaskService, 要件定義）
- **既存機能への影響**: なし（新規 ActionType の追加のみ）
- **テスト**: 単体テスト追加、既存テストの回帰確認

---

## 概要

Activity テーブルを拡張して、タスクの担当者変更履歴と差し戻し（再開）履歴を記録できるようにします。これにより、ゲーミフィケーションで以下のバッジが実装可能になります：

| バッジ | 必要な ActionType |
|-------|------------------|
| 救世主 (Savior) | TaskAssigneeChanged |
| 安定の担当者 (Steady Hand) | TaskAssigneeChanged |
| 一発完了 (First Try) | TaskReopened |
| 学習者 (Learner) | TaskReopened |
| 約束の人 (Promise Keeper) | DueDateChanged（既存・分析強化） |
| 前倒しマスター (Ahead of Schedule) | DueDateChanged（既存・分析強化） |
| 証拠を残す人 (Evidence Keeper) | FileAdded（既存・集計強化） |

---

## 修正対象ファイル一覧

### 1. Enum定義

| ファイル | 修正内容 |
|---------|---------|
| [pecus.Libs/DB/Models/Enums/ActivityActionType.cs](../../pecus.Libs/DB/Models/Enums/ActivityActionType.cs) | `TaskAssigneeChanged`, `TaskReopened` を追加 |

### 2. Details ビルダー

| ファイル | 修正内容 |
|---------|---------|
| [pecus.Libs/ActivityDetailsBuilder.cs](../../pecus.Libs/ActivityDetailsBuilder.cs) | `BuildTaskAssigneeChangedDetails()`, `BuildTaskReopenedDetails()` を追加 |

### 3. サービス層

| ファイル | 修正内容 |
|---------|---------|
| [pecus.WebApi/Services/WorkspaceTaskService.cs](../../pecus.WebApi/Services/WorkspaceTaskService.cs) | タスク更新時に担当者変更・再開を検出してActivity記録 |

### 4. ドキュメント（更新済み）

| ファイル | 状態 |
|---------|------|
| [docs/spec/activity-requirements.md](activity-requirements.md) | ✅ 更新済み（ActionType定義、分析セクション追加） |
| [docs/spec/task-motivation-ideas.md](task-motivation-ideas.md) | ✅ 更新済み（Activity拡張後バッジセクション追加） |

---

## 実装詳細

### Phase 1: Enum 拡張

**ファイル**: `pecus.Libs/DB/Models/Enums/ActivityActionType.cs`

```csharp
// 既存の TaskDiscarded の後に追加
/// <summary>
/// タスク担当者変更
/// </summary>
TaskAssigneeChanged,
/// <summary>
/// タスク再開（差し戻し）
/// </summary>
TaskReopened
```

**注意**: Enum の順序は既存の値の後に追加すること（DBに保存されている整数値との互換性）

---

### Phase 2: ActivityDetailsBuilder 拡張

**ファイル**: `pecus.Libs/ActivityDetailsBuilder.cs`

#### 2.1 タスク担当者変更用メソッド追加

```csharp
/// <summary>
/// タスク担当者変更用の Details を生成
/// </summary>
/// <param name="taskId">タスクID</param>
/// <param name="content">タスク内容</param>
/// <param name="oldAssigneeName">変更前の担当者名（null = 未割当）</param>
/// <param name="oldAssigneeId">変更前の担当者ID（null = 未割当）</param>
/// <param name="newAssigneeName">変更後の担当者名（null = 未割当）</param>
/// <param name="newAssigneeId">変更後の担当者ID（null = 未割当）</param>
/// <returns>変更があればJSON文字列、変更がなければnull</returns>
public static string? BuildTaskAssigneeChangedDetails(
    int taskId,
    string content,
    string? oldAssigneeName,
    int? oldAssigneeId,
    string? newAssigneeName,
    int? newAssigneeId)
{
    if (oldAssigneeId == newAssigneeId) return null;

    return JsonSerializer.Serialize(new
    {
        taskId,
        content,
        oldAssignee = oldAssigneeName,
        oldAssigneeId,
        newAssignee = newAssigneeName,
        newAssigneeId
    }, JsonOptions);
}
```

#### 2.2 タスク再開用メソッド追加

```csharp
/// <summary>
/// タスク再開（差し戻し）用の Details を生成
/// </summary>
/// <param name="taskId">タスクID</param>
/// <param name="content">タスク内容</param>
/// <param name="assigneeName">担当者名</param>
/// <param name="reopenedByName">再開操作したユーザー名</param>
public static string BuildTaskReopenedDetails(
    int taskId,
    string content,
    string? assigneeName,
    string reopenedByName)
{
    return JsonSerializer.Serialize(new
    {
        taskId,
        content,
        assignee = assigneeName,
        reopenedBy = reopenedByName
    }, JsonOptions);
}
```

---

### Phase 3: WorkspaceTaskService 修正

**ファイル**: `pecus.WebApi/Services/WorkspaceTaskService.cs`

#### 3.1 スナップショットに AssigneeId, AssigneeName 追加（既存）

現在のスナップショット構造を確認し、`AssigneeId` と `AssigneeName` が含まれていることを確認。

```csharp
// 既存のスナップショット（UpdateTaskAsync メソッド内）
var snapshot = new
{
    // ... 既存フィールド
    AssignedUserId = task.AssignedUserId,
    AssigneeName = task.AssignedUser?.Username,
    IsCompleted = task.IsCompleted,
    // ...
};
```

#### 3.2 担当者変更のActivity記録を追加

`UpdateTaskAsync` メソッド内、タスク完了/破棄のActivity記録セクションに追加：

```csharp
// アクティビティ記録: タスク担当者変更
if (snapshot.AssignedUserId != task.AssignedUserId)
{
    // 新しい担当者名を取得
    string? newAssigneeName = null;
    if (task.AssignedUserId.HasValue)
    {
        var newAssignee = await _context.Users.FindAsync(task.AssignedUserId.Value);
        newAssigneeName = newAssignee?.Username;
    }

    var taskAssigneeChangedDetails = ActivityDetailsBuilder.BuildTaskAssigneeChangedDetails(
        task.Id,
        snapshot.Content,
        snapshot.AssigneeName,
        snapshot.AssignedUserId,
        newAssigneeName,
        task.AssignedUserId
    );

    if (taskAssigneeChangedDetails != null)
    {
        _backgroundJobClient.Enqueue<ActivityTasks>(x =>
            x.RecordActivityAsync(workspaceId, itemId, currentUserId, ActivityActionType.TaskAssigneeChanged, taskAssigneeChangedDetails)
        );
    }
}
```

#### 3.3 タスク再開のActivity記録を追加

```csharp
// アクティビティ記録: タスク再開（完了→未完了に戻された場合のみ）
if (snapshot.IsCompleted && !task.IsCompleted)
{
    // 操作ユーザー名を取得
    var currentUser = await _context.Users.FindAsync(currentUserId);
    var reopenedByName = currentUser?.Username ?? "不明";

    var taskReopenedDetails = ActivityDetailsBuilder.BuildTaskReopenedDetails(
        task.Id,
        snapshot.Content,
        snapshot.AssigneeName,
        reopenedByName
    );
    _backgroundJobClient.Enqueue<ActivityTasks>(x =>
        x.RecordActivityAsync(workspaceId, itemId, currentUserId, ActivityActionType.TaskReopened, taskReopenedDetails)
    );
}
```

---

## 実装順序

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: Enum定義                                               │
│ └─ ActivityActionType.cs に TaskAssigneeChanged, TaskReopened   │
├─────────────────────────────────────────────────────────────────┤
│ Phase 2: Detailsビルダー                                        │
│ └─ ActivityDetailsBuilder.cs に2メソッド追加                    │
├─────────────────────────────────────────────────────────────────┤
│ Phase 3: サービス層                                             │
│ └─ WorkspaceTaskService.cs の UpdateTaskAsync に記録ロジック    │
├─────────────────────────────────────────────────────────────────┤
│ Phase 4: テスト                                                 │
│ ├─ 担当者変更シナリオのテスト                                   │
│ ├─ タスク再開シナリオのテスト                                   │
│ └─ 既存テストの回帰確認                                         │
├─────────────────────────────────────────────────────────────────┤
│ Phase 5: ビルド・検証                                           │
│ ├─ dotnet build pecus.sln                                       │
│ └─ 動作確認（手動テスト）                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## テストシナリオ

### 担当者変更（TaskAssigneeChanged）

| シナリオ | 期待結果 |
|---------|---------|
| 未割当 → ユーザーA | Activity記録される（oldAssigneeId=null, newAssigneeId=A） |
| ユーザーA → ユーザーB | Activity記録される（oldAssigneeId=A, newAssigneeId=B） |
| ユーザーA → 未割当 | Activity記録される（oldAssigneeId=A, newAssigneeId=null） |
| ユーザーA → ユーザーA（変更なし） | Activity記録されない |

### タスク再開（TaskReopened）

| シナリオ | 期待結果 |
|---------|---------|
| 完了 → 未完了 | Activity記録される（reopenedBy=操作者名） |
| 未完了 → 完了 | TaskCompleted として記録（既存動作） |
| 未完了 → 未完了 | Activity記録されない |

---

## 影響範囲

### 影響なし

- **DB スキーマ**: マイグレーション不要（Activity.Details は jsonb、ActionType は C# enum）
- **既存API**: 変更なし
- **フロントエンド**: Activity表示は ActionType に依存しない設計（Details をそのまま表示）

### 影響あり（後続タスク）

- **ゲーミフィケーション実装**: 新しいバッジの Strategy 実装が可能になる
- **Activity UI**: 新しい ActionType の表示ラベル追加（任意）

---

## 関連ドキュメント

- [activity-requirements.md](activity-requirements.md) - Activity機能の要件定義（ゲーミフィケーション分析セクション追加済み）
- [task-motivation-ideas.md](task-motivation-ideas.md) - バッジアイディア集（Activity拡張後セクション追加済み）
- [gamification-implementation-plan.md](gamification-implementation-plan.md) - ゲーミフィケーション全体の実装計画

---

## チェックリスト

実装時に確認すること：

- [ ] `ActivityActionType` enum に `TaskAssigneeChanged`, `TaskReopened` を追加
- [ ] `ActivityDetailsBuilder` に `BuildTaskAssigneeChangedDetails`, `BuildTaskReopenedDetails` を追加
- [ ] `WorkspaceTaskService.UpdateTaskAsync` にActivity記録ロジックを追加
- [ ] `dotnet build pecus.sln` が成功する
- [ ] 担当者変更時にActivityが記録される
- [ ] タスク再開時にActivityが記録される
- [ ] 既存のTaskCompleted, TaskDiscardedの動作に影響がない
