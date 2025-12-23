# 週間レポート機能 設計書

## メタ情報

- 版: v1.0
- 作成日: 2025-12-23
- ステータス: 設計中

---

## AI エージェント向け要約（必読）

- 週間レポートは組織単位で、各ユーザーの役割に応じた情報を配信する
- 配信先は「ワークスペースオーナー」「コミッター」「その他メンバー」の3分類
- レポートは1テンプレートで、役割に応じてセクションを出し分ける（案B方式）
- 配信曜日は `OrganizationSetting.WeeklyReportDeliveryDay` を参照
- データ収集・メール配信は Hangfire ジョブで実行

---

## 1. 概要

### 1.1 目的

組織内の週次統計情報をまとめ、メンバーに配信することで：
- 各自の作業状況の振り返りを促す
- 責任範囲の進捗を把握できるようにする
- ダッシュボードへの誘導を行う

### 1.2 基本方針

- **必要な情報を必要な人に必要な分だけ** 配信する
- 情報過多による「読まれないレポート」を避ける
- 1テンプレートで役割別にセクションを出し分ける

---

## 2. 配信先の分類

| 分類 | 判定条件 | 視点 |
|------|----------|------|
| **ワークスペースオーナー** | `WorkspaceUser.Role = Owner` | 自分のWSの健全性を把握 |
| **コミッター** | `WorkspaceItem.CommitterId = userId` | 担当アイテム/タスクの進捗 |
| **その他メンバー** | 上記以外の組織メンバー | 自分のタスクの状況 |

※ 1ユーザーが複数の役割を持つ場合、該当するセクションがすべて表示される

---

## 3. レポート構成（案B方式）

### 3.1 メール件名

```
[Coati] 週間レポート: {組織名}（{YYYY/MM/DD}週）
```

### 3.2 レポート本文構成

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 あなたの今週（全員表示）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

完了したタスク: N件
残りのタスク:   N件
期限切れ:       N件 ⚠️（該当がある場合のみ警告表示）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 あなたが責任を持つアイテム（コミッターのみ表示）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

・アイテムA（WS名）
  進捗: 80%（残り2タスク / 来週期限: 1件）

・アイテムB（WS名）
  進捗: 50%（期限切れ1件 ⚠️ / 来週期限: 3件）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 あなたのワークスペース（オーナーのみ表示）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

・ワークスペースA
  進行中: 12件 / 完了: 5件 / 期限切れ: 2件 ⚠️ / 来週期限: 4件

・ワークスペースB
  進行中: 8件 / 完了: 3件 / 期限切れ: 0件 / 来週期限: 2件

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ダッシュボードを開く] ← リンクボタン
```

---

## 4. 集計データ仕様

### 4.1 全員共通: あなたの今週

| データ | 集計条件 |
|--------|----------|
| 完了したタスク | `Task.AssigneeUserId = userId` AND `Task.Status = Completed` AND `Task.CompletedAt` が今週内 |
| 残りのタスク | `Task.AssigneeUserId = userId` AND `Task.Status IN (NotStarted, InProgress)` |
| 期限切れ | `Task.AssigneeUserId = userId` AND `Task.Status NOT IN (Completed, Discarded)` AND `Task.DueDate < 今日` |

### 4.2 コミッター向け: 責任を持つアイテム

| データ | 集計条件 |
|--------|----------|
| 対象アイテム | `WorkspaceItem.CommitterId = userId` AND `WorkspaceItem.Status = Published` |
| 進捗率 | `完了タスク数 / 全タスク数 × 100` |
| 残りタスク数 | `Task.Status NOT IN (Completed, Discarded)` |
| 期限切れ数 | `Task.DueDate < 今日` AND `Task.Status NOT IN (Completed, Discarded)` |
| 来週期限数 | `Task.DueDate` が来週内（月〜日） AND `Task.Status NOT IN (Completed, Discarded)` |

### 4.3 オーナー向け: ワークスペース状況

| データ | 集計条件 |
|--------|----------|
| 対象WS | `WorkspaceUser.UserId = userId` AND `WorkspaceUser.Role = Owner` |
| 進行中 | `Task.Status IN (NotStarted, InProgress)` |
| 完了（今週） | `Task.Status = Completed` AND `Task.CompletedAt` が今週内 |
| 期限切れ | `Task.DueDate < 今日` AND `Task.Status NOT IN (Completed, Discarded)` |
| 来週期限 | `Task.DueDate` が来週内（月〜日） AND `Task.Status NOT IN (Completed, Discarded)` |

---

## 5. 配信設定

### 5.1 配信曜日

`OrganizationSetting.WeeklyReportDeliveryDay` で指定：

| 値 | 曜日 |
|----|------|
| 0 | 配信無効（未設定） |
| 1 | 月曜日 |
| 2 | 火曜日 |
| 3 | 水曜日 |
| 4 | 木曜日 |
| 5 | 金曜日 |
| 6 | 土曜日 |
| 7 | 日曜日 |

### 5.2 配信時刻

- 設定ファイル（`appsettings.json`）より取得
- デフォルト: 午前8時（JST）

### 5.3 集計対象期間

- **月曜起点**（月曜〜日曜）を1週間として集計
- 配信日の前週を対象とする
- 例: 月曜配信の場合、前週の月曜00:00〜日曜23:59:59

---

## 6. 技術設計

### 6.1 Hangfire ジョブ構成

```
[毎日実行] WeeklyReportSchedulerJob
    ↓
    各組織の WeeklyReportDeliveryDay をチェック
    ↓
    今日が配信日の組織に対して WeeklyReportGeneratorJob をキュー

[組織単位] WeeklyReportGeneratorJob(organizationId)
    ↓
    組織メンバー一覧を取得
    ↓
    各ユーザーの役割を判定
    ↓
    ユーザーごとにデータ集計
    ↓
    メール送信（またはバッチ送信）
```

### 6.2 関連ファイル（予定）

| ファイル | 役割 |
|----------|------|
| `pecus.BackFire/Services/WeeklyReportSchedulerJob.cs` | 毎日実行、配信対象組織を判定 |
| `pecus.BackFire/Services/WeeklyReportGeneratorJob.cs` | 組織単位でレポート生成・配信 |
| `pecus.Libs/Mail/Templates/WeeklyReport.cshtml` | メールテンプレート |
| `pecus.Libs/WeeklyReport/WeeklyReportDataCollector.cs` | データ集計ロジック |

### 6.3 パフォーマンス考慮

- 大規模組織では、ユーザーごとの集計をバッチ処理
- 集計クエリは可能な限りDB側で完結させる
- メール送信は非同期キュー経由

---

## 7. 今後の拡張候補（スコープ外）

| 機能 | 説明 |
|------|------|
| 前週比較 | 「前週比 +N件」のような比較表示 |
| 平均タスク完了時間 | 作成→完了までの平均日数 |

---

## 8. 決定事項

- [x] 配信時刻: 設定ファイルから取得（デフォルト 8:00）
- [x] ユーザー単位のオプトアウト機能: 不要
- [x] メール以外の代替手段: 不要
- [x] 週の起点: 月曜固定（変更不可）

---

## 変更履歴

| 日付 | 版 | 内容 |
|------|-----|------|
| 2025-12-23 | v1.0 | 初版作成 |
