# ワークスペース・アイテム・タスクの関係

## 概要

Coati における情報管理の基本構造を説明する。

```
Organization（組織）
  └─ Workspace（ワークスペース）
       └─ WorkspaceItem（アイテム = コンテンツ）
            └─ WorkspaceTask（タスク = 作業）
```

---

## 3つのエンティティの役割

| エンティティ | 役割 | 例 |
|-------------|------|-----|
| **Workspace** | プロジェクト・チーム・ドキュメント集の器 | 「製品開発」「操作マニュアル」「営業チーム」 |
| **WorkspaceItem** | コンテンツ（ページ、ドキュメント、情報） | 「ログイン手順」ページ、「API仕様書」、「顧客A情報」 |
| **WorkspaceTask** | 作業単位（やるべきこと） | 「キャプチャ撮影」「レビュー」「見積もり作成」 |

### 重要なポイント

1. **タスクは必ずアイテムに紐づく**
   - `WorkspaceTask` は `WorkspaceItem` の子要素として存在する

2. **同じワークスペースでも使い方は自由**
   - プロジェクト管理として使う人もいれば、ナレッジベースとして使う人もいる

3. **アイテムとタスクは1対多**
   - 1つのアイテムに対して複数のタスクを作成できる

4. **アイテムにタスクがなくても良い**
   - タスクなしで純粋なドキュメントとしてアイテムを使うことも可能

---

## 具体的なシチュエーション

### シチュエーション1: 操作マニュアル作成

**ワークスペース**: 「製品操作マニュアル」

このワークスペースでは、アイテムは「マニュアルのページ」として機能する。

```
Workspace: 製品操作マニュアル
│
├─ Item: ログイン手順
│   ├─ Task: スクリーンショット撮影（担当: 田中）
│   ├─ Task: 説明文執筆（担当: 田中）
│   ├─ Task: レビュー（担当: 鈴木）
│   └─ Task: 校正・公開（担当: 田中）
│
├─ Item: ダッシュボードの使い方
│   ├─ Task: 機能調査（担当: 佐藤）
│   ├─ Task: 説明文執筆（担当: 佐藤）
│   └─ Task: レビュー（担当: 鈴木）
│
└─ Item: トラブルシューティング
    └─ Task: FAQ収集（担当: 田中）
```

**ポイント**:
- アイテム = 完成させたいページ
- タスク = そのページを完成させるための作業ステップ
- 同じアイテムに対して複数人がタスクを持つことも可能

---

### シチュエーション2: ソフトウェア開発プロジェクト

**ワークスペース**: 「ECサイトリニューアル」

このワークスペースでは、アイテムは「設計書・仕様書」や「機能単位」、タスクは「開発作業」として機能する。

```
Workspace: ECサイトリニューアル
│
├─ Item: API設計書
│   ├─ Task: エンドポイント一覧作成（担当: 山田）
│   └─ Task: 設計レビュー（担当: 佐藤）
│
├─ Item: DB設計書
│   └─ Task: ER図作成（担当: 鈴木）
│
├─ Item: 認証機能
│   ├─ Task: 設計（担当: 山田）
│   ├─ Task: 実装（担当: 山田）
│   └─ Task: テスト（担当: 佐藤）
│
├─ Item: 商品一覧機能
│   ├─ Task: 設計（担当: 山田）
│   ├─ Task: 実装（担当: 山田）
│   └─ Task: テスト（担当: 佐藤）
│
└─ Item: リリースノート
    └─ Task: 変更点まとめ（担当: 鈴木）
```

**ポイント**:
- アイテム = ドキュメント、または機能単位
- タスク = そのアイテムに対する作業（設計・実装・テストなど）
- 先行タスク機能で「API設計書完了 → 認証機能実装」のような依存関係を表現

---

### シチュエーション3: 営業チームの顧客管理

**ワークスペース**: 「営業2課」

このワークスペースでは、アイテムは「顧客情報」や「社内ドキュメント」、タスクは「営業活動」として機能する。

```
Workspace: 営業2課
│
├─ Item: 株式会社ABC（顧客情報）
│   ├─ Task: 初回訪問（担当: 高橋）
│   ├─ Task: 見積もり作成（担当: 高橋）
│   ├─ Task: 提案書作成（担当: 高橋）
│   └─ Task: クロージング（担当: 高橋）
│
├─ Item: DEF工業（顧客情報）
│   ├─ Task: ニーズヒアリング（担当: 渡辺）
│   └─ Task: デモ実施（担当: 渡辺）
│
├─ Item: 展示会出展
│   ├─ Task: ブース準備（担当: 高橋）
│   └─ Task: 配布資料作成（担当: 渡辺）
│
├─ Item: 月次レポート
│   └─ Task: 12月度レポート作成（担当: 渡辺）
│
└─ Item: 営業マニュアル
    └─ Task: 新人向け資料更新（担当: 渡辺）
```

**ポイント**:
- アイテム = 顧客情報カード、イベント、社内ドキュメント
- タスク = そのアイテムに対する作業
- 顧客ごとにタスクの進捗を追跡できる
- 展示会やレポートも「アイテム」として管理し、その中にタスクを作成

---

### シチュエーション4: デザインガイドライン（タスクなし）🚧 feat

**ワークスペース**: 「ブランドガイドライン」

このワークスペースは純粋な**ナレッジベース・リファレンス**として機能する。
タスクは作成せず、アイテムのみでドキュメントを管理する。

> 🚧 **将来機能: ドキュメントモード**
>
> ワークスペースに「ドキュメントモード」を設けることで、アイテムをツリー構造で管理できるようになる予定。
> WorkspaceItemRelation を使ってアイテム間の親子関係を表現し、階層的なドキュメント構造を実現する。

```
Workspace: ブランドガイドライン（ドキュメントモード）
│
├─ Item: はじめに
│
├─ Item: ロゴ
│   ├─ Item: ロゴ使用規定
│   ├─ Item: 最小サイズ・余白
│   └─ Item: 禁止事項
│
├─ Item: カラー
│   ├─ Item: プライマリカラー
│   ├─ Item: セカンダリカラー
│   └─ Item: アクセントカラー
│
├─ Item: タイポグラフィ
│   ├─ Item: 見出しフォント
│   └─ Item: 本文フォント
│
├─ Item: UIコンポーネント
│   ├─ Item: ボタン
│   ├─ Item: フォーム
│   ├─ Item: カード
│   └─ Item: モーダル
│
└─ Item: 付録
    ├─ Item: アイコンライブラリ
    └─ Item: ダウンロード素材
```

**ポイント**:
- アイテム = ドキュメントのセクション・ページ
- タスク = なし（更新作業が発生したときだけ作成）
- **アイテム同士の親子関係**でツリー構造を表現
- 目次のような階層ナビゲーションが可能に

**このパターンが適するケース**:
- 社内Wiki・ナレッジベース
- 技術ドキュメント・仕様書
- 規約・ポリシー文書
- ヘルプセンター・FAQ
- 製品マニュアル（章・節構造）

---

## データモデル

### WorkspaceItem

```csharp
public class WorkspaceItem
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public string Subject { get; set; }      // 件名・タイトル
    public string? Body { get; set; }         // 本文
    public bool IsDraft { get; set; }         // 下書き状態
    public bool IsArchived { get; set; }      // アーカイブ状態
    public int? AssigneeId { get; set; }      // 担当者（オプション）
    public int? CommitterId { get; set; }     // コミッター（オプション）
    // ...
}
```

### WorkspaceTask

```csharp
public class WorkspaceTask
{
    public int Id { get; set; }
    public int WorkspaceId { get; set; }
    public int WorkspaceItemId { get; set; }  // アイテムに紐づく（必須）
    public int AssignedUserId { get; set; }   // 担当者（必須）
    public string Content { get; set; }       // タスク内容
    public TaskPriority? Priority { get; set; }
    public DateTimeOffset DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public int ProgressPercentage { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsDiscarded { get; set; }
    public int? PredecessorTaskId { get; set; } // 先行タスク（新規追加予定）
    // ...
}
```

### 関係性

```
Workspace (1) ─────────── (N) WorkspaceItem
                                   │
                                   │ (1)
                                   ↓
                              (N) WorkspaceTask
```

- Workspace : WorkspaceItem = 1 : N
- WorkspaceItem : WorkspaceTask = 1 : N

---

## Activity との関係

**Activity は WorkspaceItem に対する操作履歴を記録する**。
ただし、監視目的ではなく「何が起きたか」を振り返るための記録。

> 📖 **設計理念**（[activity-requirements.md](activity-requirements.md) より）
>
> アクティビティはユーザーを監視するためのものではない。
> 寝ていようが酒を飲んでいようが、タスクが進めばそれでいい。
> 「誰が何時間働いたか」ではなく「タスクに何が起きたか」を記録する。

### なぜ WorkspaceTask には Activity を記録しないのか

| エンティティ | Activity 記録 | 理由 |
|-------------|--------------|------|
| **WorkspaceItem** | ✅ 記録対象 | アイテムは「成果物」。何が起きたかを残す価値がある |
| **WorkspaceTask** | ❌ 現時点では対象外 | タスクは「作業」。完了したかどうかだけが重要 |

**タスクの状態変化はタスクエンティティ自体から取得できる**:
- `IsCompleted` / `IsDiscarded` — 完了・破棄状態
- `ProgressPercentage` — 進捗率
- `UpdatedAt` — 最終更新日時

Hangfire がジョブを処理していくように、人間がタスクを処理していく。
ワーカーがいつ起きてたかではなく、**ジョブが完了したかどうか**だけを見る。

---

## 関連ドキュメント

- [ダッシュボード統計機能](dashboard-statistics.md) - アイテム・タスク両方の統計
- [タスクフォーカス推奨機能](task-focus-recommendation.md) - タスクの優先順位付け
- [アクティビティ要件定義](activity-requirements.md) - アイテム操作の記録
