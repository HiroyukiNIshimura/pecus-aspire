# ワークスペースアイテム タスク自動生成機能 - 設計書

## 概要

生成AIを活用して、ワークスペースアイテム（プロジェクト/タスク管理の親要素）から、
その内容を実現するためのタスク候補を自動生成する機能。

## 1. 要件

### 1.1 入力情報

| 項目 | ソース | 備考 |
|------|--------|------|
| ワークスペースジャンル | `Workspace.Genre` | カテゴリー情報 |
| アイテム件名 | `WorkspaceItem.Subject` | 必須 |
| アイテム本文 | `WorkspaceItem.Body` | Lexical JSON → Markdown変換必要 |
| 開始日 | ユーザー指定 | アイテムには存在しない |
| 完了日 | `WorkspaceItem.DueDate` or ユーザー指定 | |
| タスクタイプ一覧 | `TaskType` テーブル | AIがタスク種類を選択するための参照情報 |

### 1.2 生成AIに求める出力

- タスク候補リスト（内容、タスクタイプ、推定工数）
- 依存関係（先行タスク）
- クリティカルパス判定
- 並行作業可能性

### 1.3 承認フロー

```
[AI生成] → [ドラフトタスク候補] → [人間が担当者割当・編集] → [正式タスク作成]
```

- 実際のタスク作成には人間の承認が必要
- 不要なタスクの削除、足りないタスクの追加が可能
- AIとのイテレーション（再生成・フィードバック）をサポート

---

## 2. 課題点と解決策

### 2.1 担当者の指定

**問題**: `WorkspaceTask.AssignedUserId` は必須だがAIには指定不可

**解決策**: ハイブリッドアプローチ（推奨）

- アイテムの `Assignee` または `Owner` をデフォルト担当者として設定
- 承認UI上で各タスクの担当者を個別に変更可能

| 案 | 説明 | メリット | デメリット |
|----|------|----------|------------|
| A. デフォルト担当者 | アイテムのAssignee/Ownerをデフォルト設定 | シンプル | 全タスク同一担当者になる |
| B. 候補画面で割当 | 承認UIで各タスクに担当者を選択 | 柔軟性高い | UI複雑化 |
| **C. ハイブリッド** | デフォルト設定＋個別変更可能 | バランス良い | **採用** |

### 2.2 工数見積の精度

**問題**: AIの工数見積は不正確になりがち

**解決策**: AIの工数見積は**参考情報としてのみ表示**し、タスク作成時には利用しない

- AIには「相対的な規模感」（S/M/L/XL）を出力させる
- 規模感はUI上で参考情報として表示するのみ
- 実際の工数（`EstimatedHours`）は**人間が承認時に手動入力**する
- 工数未入力でもタスク作成可能（任意項目）

```
[AI提案]           [承認UI]
規模: M (参考)  →  工数: [    ] h  ← 人間が入力
```

> **理由**: AIの工数見積は精度が低く、そのまま利用すると計画の信頼性が損なわれる。
> 規模感を参考にしつつ、最終的な工数判断は人間が行うことで精度を担保する。

### 2.3 開始日がアイテムに存在しない

**解決策**: タスク生成リクエスト時にユーザーが指定する

---

## 3. データモデル設計

### 3.1 タスク候補の一時保存

AIとのイテレーションはフロントエンド側のステート管理で対応。
DB保存は最終承認後のみ（新規テーブル不要）。

### 3.2 AI応答の型定義

```typescript
/** AIが生成するタスク候補 */
export interface GeneratedTaskCandidate {
  /** 一時的なID（フロント管理用） */
  tempId: string;
  /** タスク内容 */
  content: string;
  /** タスクタイプID（AIがTaskTypeテーブルから選択） */
  suggestedTaskTypeId: number | null;
  /** タスクタイプ選択理由（AIが判断根拠を説明） */
  taskTypeRationale: string;
  /** 規模感（参考情報として表示のみ、タスク作成には使用しない） */
  estimatedSize: 'S' | 'M' | 'L' | 'XL';
  /** 先行タスクの一時ID（依存関係） */
  predecessorTempIds: string[];
  /** クリティカルパス上か */
  isOnCriticalPath: boolean;
  /** 並行作業可能か */
  canParallelize: boolean;
  /** 推奨開始日（プロジェクト開始からの相対日数） */
  suggestedStartDayOffset: number;
  /** 推奨期間（日数） */
  suggestedDurationDays: number;
  /** AIによる補足説明 */
  rationale: string;
}

/** タスク生成AIの応答 */
export interface TaskGenerationResponse {
  /** 生成されたタスク候補 */
  candidates: GeneratedTaskCandidate[];
  /** プロジェクト全体の推定期間（日数） */
  totalEstimatedDays: number;
  /** クリティカルパスの説明 */
  criticalPathDescription: string;
  /** AIからの提案・注意事項 */
  suggestions: string[];
}
```

### 3.3 承認後の作成リクエスト

```typescript
/** 承認済みタスク（人間が編集した最終版） */
export interface ApprovedTaskRequest {
  content: string;
  taskTypeId: number;
  assignedUserId: number;
  priority?: TaskPriority;
  startDate?: string;
  dueDate: string;
  /** 工数（人間が手動入力、AIの推定値は使用しない） */
  estimatedHours?: number;
  /** 同一バッチ内での先行タスクインデックス */
  predecessorIndex?: number;
}

/** 一括タスク作成リクエスト */
export interface BulkCreateTasksRequest {
  tasks: ApprovedTaskRequest[];
}
```

---

## 4. API設計

### 4.1 タスク候補生成エンドポイント

```
POST /api/workspaces/{workspaceId}/items/{itemId}/tasks/generate-candidates
```

**リクエスト**:

```csharp
public class GenerateTaskCandidatesRequest
{
    /// <summary>プロジェクト開始日</summary>
    [Required]
    public DateOnly StartDate { get; set; }

    /// <summary>プロジェクト完了日（アイテムのDueDateと異なる場合）</summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>追加のコンテキスト情報（ユーザーからの補足）</summary>
    [MaxLength(2000)]
    public string? AdditionalContext { get; set; }

    /// <summary>前回の生成結果へのフィードバック（イテレーション用）</summary>
    [MaxLength(2000)]
    public string? Feedback { get; set; }

    /// <summary>前回生成されたタスク候補（イテレーション用）</summary>
    public List<PreviousCandidate>? PreviousCandidates { get; set; }
}

public class PreviousCandidate
{
    public required string Content { get; set; }
    public bool IsAccepted { get; set; }
    public string? RejectionReason { get; set; }
}
```

**レスポンス**: `TaskGenerationResponse` 型（上記参照）

### 4.2 一括タスク作成エンドポイント

```
POST /api/workspaces/{workspaceId}/items/{itemId}/tasks/bulk-create
```

**リクエスト**:

```csharp
public class BulkCreateTasksRequest
{
    [Required]
    [MinLength(1)]
    public required List<BulkTaskItem> Tasks { get; set; }
}

public class BulkTaskItem
{
    [Required]
    [MaxLength(500)]
    public required string Content { get; set; }

    [Required]
    public int TaskTypeId { get; set; }

    [Required]
    public int AssignedUserId { get; set; }

    public TaskPriority? Priority { get; set; }

    public DateOnly? StartDate { get; set; }

    [Required]
    public DateOnly DueDate { get; set; }

    /// <summary>工数（人間が手動入力、AIの推定値は使用しない）</summary>
    public decimal? EstimatedHours { get; set; }

    /// <summary>同一リクエスト内での先行タスクのインデックス（0始まり）</summary>
    public int? PredecessorIndex { get; set; }
}
```

**レスポンス**: 作成されたタスクのリスト

---

## 5. プロンプト設計

### 5.1 システムプロンプト

```
あなたはプロジェクト管理の専門家です。
与えられたプロジェクト情報から、実行可能なタスクリストを生成してください。

## 出力ルール
1. 各タスクは具体的で実行可能な単位に分割する
2. 依存関係を明確にし、クリティカルパスを特定する
3. 並行作業可能なタスクを識別する
4. 規模感（S/M/L/XL）を現実的に見積もる
  - S: 半日以内（〜4時間）
  - M: 1日程度（〜8時間）
  - L: 2-3日（〜24時間）
  - XL: 1週間程度（〜40時間）
5. タスクタイプは提供されたリストから最適なものを選択する
  - 各タスクの性質に最も合致するタスクタイプIDを指定
  - 該当するものがない場合はnullを指定
  - 選択理由を taskTypeRationale に記載

## 出力形式
JSON形式で出力してください。
```

### 5.2 ユーザープロンプト構成

1. プロジェクト情報（ジャンル、件名、期間）
2. 詳細内容（本文のMarkdown）
3. 利用可能なタスクタイプ一覧（`TaskType` テーブルから取得）
   - ID、コード、名称、説明を含める
   - 例: `ID:1 [design] 設計 - システム設計やアーキテクチャ設計`
4. 追加コンテキスト（任意）
5. 前回の生成結果（イテレーション時）
6. フィードバック（イテレーション時）

### 5.3 タスクタイプ情報の形式

AIに渡すタスクタイプ情報は以下の形式：

```
## 利用可能なタスクタイプ
以下のリストから各タスクに最適なタイプを選択してください。

| ID | コード | 名称 | 説明 |
|----|--------|------|------|
| 1 | design | 設計 | システム設計やアーキテクチャ設計 |
| 2 | development | 開発 | 実装・コーディング作業 |
| 3 | review | レビュー | コードレビューやドキュメントレビュー |
| 4 | testing | テスト | テスト計画・実行・検証 |
| ... | ... | ... | ... |
```

---

## 6. UIフロー設計

### 6.1 タスク生成モーダル

```
┌─────────────────────────────────────────────────────────────┐
│  タスク自動生成                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ■ プロジェクト期間                                          │
│  開始日: [2026-02-01] 〜 完了日: [2026-03-31]               │
│                                                             │
│  ■ 追加情報（任意）                                          │
│  [                                        ]                 │
│                                                             │
│  [🤖 タスクを生成]                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ■ 生成されたタスク候補                                      │
│                                                             │
│  ☑ [要件定義書作成]        担当: [▼ 選択] 工数: [  ]h  M   🔴CP  │
│  ☑ [DB設計]               担当: [▼ 選択] 工数: [  ]h  L   🔴CP  │
│  ☑ [API設計]              担当: [▼ 選択] 工数: [  ]h  M   ═══   │
│  ☐ [画面モック作成]        担当: [▼ 選択] 工数: [  ]h  S   ═══   │
│  ☑ [実装: ユーザー認証]    担当: [▼ 選択] 工数: [  ]h  L   🔴CP  │
│                                                             │
│  ■ フィードバック（修正依頼）                                │
│  [テストタスクも追加してください                ]             │
│                                                             │
│  [🔄 再生成]  [✓ 選択したタスクを作成]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

🔴CP = クリティカルパス
═══ = 並行作業可能
S/M/L/XL = AI推定の規模感（参考情報）
```

### 6.2 UI要素

| 要素 | 説明 |
|------|------|
| 期間入力 | 開始日・完了日のDatePicker |
| 追加情報 | テキストエリア（任意） |
| 生成ボタン | AI生成を実行 |
| タスク候補リスト | チェックボックス付きリスト |
| 担当者選択 | ワークスペースメンバーのドロップダウン |
| 規模感表示 | AIが推定した規模感（S/M/L/XL）を参考情報として表示 |
| 工数入力 | 数値入力（人間が手動入力、AIの推定値は使用しない） |
| フィードバック | テキストエリア（イテレーション用） |
| 再生成ボタン | フィードバックを含めて再生成 |
| 作成ボタン | 選択したタスクを一括作成 |

---

## 7. 実装ステップ

| Phase | 内容 | 見積 |
|-------|------|------|
| 1 | プロンプトテンプレート実装 | 0.5日 |
| 2 | `TaskGenerationService` 実装 | 1日 |
| 3 | API エンドポイント実装（候補生成） | 0.5日 |
| 4 | API エンドポイント実装（一括作成） | 0.5日 |
| 5 | フロントエンド Server Action | 0.5日 |
| 6 | タスク生成モーダルUI | 2日 |
| 7 | テスト・調整 | 0.5日 |
| **計** | | **5.5日** |

---

## 8. 依存関係・前提条件

### 8.1 必要な既存機能

- ワークスペースメンバー取得API（担当者選択用）
- タスクタイプ取得API（AI推定用）
- Lexical→Markdown変換（既存の `LexicalConverter` を使用）
- AI クライアントファクトリ（既存の `AiClientFactory` を使用）

### 8.2 考慮事項

- **トークン制限**: 本文が長い場合は要約処理が必要
- **レート制限**: AI API呼び出しの制限を考慮
- **エラーハンドリング**: AI生成失敗時のフォールバック

---

## 9. 将来の拡張

1. **組織設定での規模→工数マッピング**: 組織ごとにS/M/L/XLの工数デフォルト値を設定可能に（参考値として入力欄にプリセット）
2. **テンプレート機能**: よく使うタスクパターンをテンプレート化
3. **学習機能**: 過去のプロジェクトから類似タスクを提案
4. **ガントチャート連携**: 生成されたタスクをガントチャートで可視化
