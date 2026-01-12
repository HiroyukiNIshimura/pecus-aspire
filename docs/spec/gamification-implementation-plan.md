# Pecus Aspire — Gamification（コアティ実績）実装計画書

最終更新: 2026-01-12

## 実装進捗サマリー

| Phase | 項目 | 状態 |
|-------|------|------|
| 1 | DB設計 & Entity | ✅ 完了 |
| 1 | Strategyパターン基盤 | ✅ 完了 |
| 1 | 全Strategy実装（28個） | ✅ 完了 |
| 1 | 組織/ユーザー設定追加 | ✅ 完了 |
| 1 | Hangfireバッチ | ✅ 完了 |
| 1 | Phase 1 動作確認テスト | ✅ 完了 |

---

## 概要

本ドキュメントは [task-motivation-ideas.md](task-motivation-ideas.md) の要件を実装に落とし込むための計画書です。

### スコープ

- **対象機能:** コアティ実績（Achievements）システム
- **除外:** ランダム応援メッセージ（実装済み）

---

## Phase 1: DB設計 & バックエンド基盤

### 1.1 Entity 設計

#### AchievementMaster（実績マスタ）

実績の定義を管理するマスタテーブル。

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `Id` | int | ✅ | PK |
| `Code` | string | ✅ | システム内ユニークコード（例: `EARLY_BIRD`） |
| `Name` | string | ✅ | 表示名（例: 暁の開拓者） |
| `NameEn` | string | ✅ | 英語表示名（例: Early Bird） |
| `Description` | string | ✅ | 説明文 |
| `DescriptionEn` | string | ✅ | 英語説明文 |
| `IconPath` | string? | - | ステッカー画像パス |
| `Difficulty` | enum | ✅ | 難易度（Easy/Medium/Hard） |
| `Category` | enum | ✅ | カテゴリ（後述） |
| `IsSecret` | bool | ✅ | シークレットバッジか（AI判定用） |
| `IsActive` | bool | ✅ | 有効フラグ |
| `SortOrder` | int | ✅ | 表示順 |
| `CreatedAt` | DateTimeOffset | ✅ | 作成日時 |
| `RowVersion` | uint | ✅ | 楽観的排他制御 |

#### UserAchievement（ユーザー実績）

ユーザーが獲得した実績を管理するテーブル。

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `Id` | int | ✅ | PK |
| `UserId` | int | ✅ | FK → Users |
| `AchievementMasterId` | int | ✅ | FK → AchievementMaster |
| `OrganizationId` | int | ✅ | FK → Organizations（検索効率化） |
| `EarnedAt` | DateTimeOffset | ✅ | 獲得日時 |
| `IsNotified` | bool | ✅ | 通知済みフラグ（Piggyback用） |
| `NotifiedAt` | DateTimeOffset? | - | 通知日時 |
| `IsMainBadge` | bool | ✅ | メインバッジとして装備中か |

**制約:**
- `(UserId, AchievementMasterId)` にユニーク制約（同一実績の重複獲得防止）
- `IsMainBadge = true` は各ユーザーにつき最大1件

### 1.2 Enum 定義

```csharp
// AchievementDifficulty
public enum AchievementDifficulty
{
    Easy = 1,    // 容易（既存データで判定可能）
    Medium = 2,  // 中難易度（履歴/ログの集計が必要）
    Hard = 3     // 高難易度（専用ロジックが必要）
}

// AchievementCategory
public enum AchievementCategory
{
    WorkStyle = 1,      // 働き方（暁の開拓者、週末の聖域）
    Productivity = 2,   // 生産性（Inbox Zero、タスク料理人）
    AI = 3,             // AI活用（AI使いの弟子）
    TeamPlay = 4,       // チームプレイ（沈黙の守護者、救世主）
    Quality = 5,        // 品質（一発完了、学習者）
    Reliability = 6     // 信頼性（安定の担当者、約束の人、前倒しマスター、証拠を残す人）
}
```

### 1.3 組織設定: Gamification公開範囲

#### OrganizationSetting への追加項目

| 設定キー | 型 | デフォルト | 説明 |
|----------|-----|------------|------|
| `GamificationBadgeVisibility` | enum | `Private` | バッジの公開範囲 |
| `GamificationAllowUserOverride` | bool | `true` | ユーザーが公開範囲を変更可能か |
| `GamificationEnabled` | bool | `true` | Gamification機能の有効/無効 |

#### BadgeVisibility Enum

```csharp
public enum BadgeVisibility
{
    Private = 1,      // 本人のみ閲覧可能（デフォルト）
    Workspace = 2,    // 同一ワークスペースメンバーに公開
    Organization = 3  // 組織内全員に公開
}
```

#### 公開範囲の制御ルール

1. **組織設定が上限**: ユーザーは組織設定より**広い範囲**には公開できない
2. **ユーザーオーバーライド**:
   - `AllowUserOverride = true` → ユーザーは組織設定以下の範囲に変更可能
   - `AllowUserOverride = false` → 組織設定で固定
3. **デフォルト `Private`** の理由: プライバシー配慮、GDPR等の規制対応

#### UserSetting への追加項目

| 設定キー | 型 | デフォルト | 説明 |
|----------|-----|------------|------|
| `BadgeVisibility` | enum? | `null` | 個人の公開範囲設定（nullは組織設定に従う） |

### 1.4 Strategy パターン（実績判定ロジック）

#### ディレクトリ構成

```
pecus.Libs/
└── Achievements/
    ├── IAchievementStrategy.cs           # 判定ロジックインターフェース
    ├── AchievementStrategyBase.cs        # 基底クラス
    ├── AchievementEvaluator.cs           # 全Strategy実行サービス
    ├── AchievementStrategyRegistry.cs    # Strategy登録・DI
    └── Strategies/
        ├── EarlyBirdStrategy.cs          # 暁の開拓者
        ├── NightOwlStrategy.cs           # 夜更かしの棟
        ├── InboxZeroStrategy.cs          # Inbox Zero
        ├── TaskChefStrategy.cs           # タスク料理人
        ├── DeadlineMasterStrategy.cs     # 期限厳守の達人
        ├── EstimationWizardStrategy.cs   # 見積もりの魔術師
        ├── SpeedStarStrategy.cs          # スピードスター
        ├── BestSupportingStrategy.cs     # 名バイプレイヤー
        ├── PriorityHunterStrategy.cs     # 高優先度ハンター
        ├── DocumenterStrategy.cs         # ドキュメンター
        ├── StreakMasterStrategy.cs       # 連続達成
        ├── CenturyStrategy.cs            # 百人力
        ├── MultitaskerStrategy.cs        # マルチタスカー
        ├── ConnectorStrategy.cs          # コネクター
        ├── CommentatorStrategy.cs        # コメンテーター
        ├── AiApprenticeStrategy.cs       # AI使いの弟子
        ├── WeekendGuardianStrategy.cs    # 週末の聖域
        ├── UnsungHeroStrategy.cs         # 沈黙の守護者
        ├── VeteranStrategy.cs            # 古参ユーザー
        ├── ThousandTasksStrategy.cs      # 千本ノック
        ├── PerfectWeekStrategy.cs        # パーフェクトウィーク
        ├── SaviorStrategy.cs             # 救世主（Activity拡張後）
        ├── SteadyHandStrategy.cs         # 安定の担当者（Activity拡張後）
        ├── FirstTryStrategy.cs           # 一発完了（Activity拡張後）
        ├── LearnerStrategy.cs            # 学習者（Activity拡張後）
        ├── PromiseKeeperStrategy.cs      # 約束の人（Activity拡張後）
        ├── AheadOfScheduleStrategy.cs    # 前倒しマスター（Activity拡張後）
        └── EvidenceKeeperStrategy.cs     # 証拠を残す人（Activity拡張後）
```

#### インターフェース設計

```csharp
public interface IAchievementStrategy
{
    /// <summary>対応する実績コード</summary>
    string AchievementCode { get; }

    /// <summary>判定を実行し、達成したユーザーIDのリストを返す</summary>
    Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default);
}
```

#### 閾値（条件パラメータ）の管理方針

**方針: Strategy内ハードコード**

実績の判定条件（閾値）は各Strategyクラス内にハードコードする。

```csharp
// 例: EarlyBirdStrategy
public class EarlyBirdStrategy : IAchievementStrategy
{
    public string AchievementCode => "EARLY_BIRD";

    // 閾値はコード内で明示（コード = 仕様書）
    private static readonly TimeOnly StartTime = new(6, 0);
    private static readonly TimeOnly EndTime = new(8, 0);
    private const int RequiredCount = 5;

    public async Task<IEnumerable<int>> EvaluateAsync(...) { ... }
}
```

```csharp
// 例: SaviorStrategy（Activity拡張後バッジ）
public class SaviorStrategy : IAchievementStrategy
{
    public string AchievementCode => "SAVIOR";

    // 他者から引き継いだタスク（TaskAssigneeChanged）を5件完了
    private const int RequiredCount = 5;

    public async Task<IEnumerable<int>> EvaluateAsync(...)
    {
        // 1. Activityから TaskAssigneeChanged を取得
        // 2. 変更後の担当者（=評価対象ユーザー）でグループ化
        // 3. そのタスクが完了（TaskCompleted）しているかを確認
        // 4. RequiredCount以上完了しているユーザーを抽出
    }
}
```

**理由:**
1. **コードが仕様書になる** — 条件が複合的（時間帯 AND 回数 AND 連続日数など）で、JSONでは表現しにくい
2. **型安全** — コンパイル時に検証可能
3. **変更追跡** — PRレビューで閾値変更が追跡可能
4. **テスト容易** — 単体テストで閾値の妥当性を検証できる
5. **YAGNI** — 組織別カスタマイズは現時点で不要。必要になった時点で設定ファイル化を検討

**AchievementMasterの責務:**
| 責務 | 管理場所 |
|------|----------|
| 表示情報（名前、説明、アイコン） | AchievementMaster（DB） |
| 判定ロジック＆閾値 | Strategy（コード） |
| 有効/無効の切り替え | AchievementMaster.IsActive（DB） |

### 1.5 Hangfire 夜間バッチ

#### AchievementEvaluationTask

```csharp
/// <summary>
/// 夜間バッチで全組織・全ユーザーの実績判定を行う Hangfire タスク
/// 推奨実行時刻: 毎日 AM 3:00（組織タイムゾーン考慮）
/// </summary>
public class AchievementEvaluationTask
{
    // 1. アクティブな全組織をループ
    // 2. 各組織のGamificationEnabled設定を確認
    // 3. 各Strategyを順次実行
    // 4. 達成した実績をUserAchievementsにIsNotified=falseで保存
    // 5. 重複チェック（既に獲得済みの場合はスキップ）
}
```

#### RecurringJob 登録

```csharp
// Program.cs または Startup
RecurringJob.AddOrUpdate<AchievementEvaluationTask>(
    "achievement-evaluation",
    x => x.EvaluateAllOrganizationsAsync(CancellationToken.None),
    "0 3 * * *", // 毎日 AM 3:00
    new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
);
```

### 1.6 Piggyback 通知（CompleteTaskTask 拡張）

既存の `CompleteTaskTask` に以下のロジックを追加:

```csharp
// タスク完了通知の後に実行
var pendingAchievements = await _context.UserAchievements
    .Where(ua => ua.UserId == userId && !ua.IsNotified)
    .Include(ua => ua.AchievementMaster)
    .ToListAsync();

if (pendingAchievements.Any())
{
    // SignalR経由で実績獲得通知を送信
    // IsNotified = true, NotifiedAt = now に更新
}
```

---

### 2 公開範囲による表示制御

他ユーザーの実績取得時（`GET /api/users/{userId}/achievements`）:

1. リクエストユーザーと対象ユーザーの関係を判定
2. 対象ユーザーの `BadgeVisibility` 設定を取得
3. 公開範囲に応じてフィルタリング:
   - `Private`: 本人以外には空配列を返却
   - `Workspace`: 同一ワークスペースメンバーのみ閲覧可
   - `Organization`: 同一組織メンバーのみ閲覧可

## 注意事項

### プロジェクトルール遵守

- **API クライアント生成（`npm run full:api`）の実行禁止** — 人間の開発者のみが実行
- **フロントからの WebApi 直 fetch 禁止** — Server Actions 経由のみ
- **Hangfire タスクは DI 経由** — 静的メソッド禁止
- **DTO に検証属性必須** — `[Required]`, `[MaxLength]` 等

### パフォーマンス考慮

- 夜間バッチは組織ごとに分割実行を検討
- 大量ユーザー組織では並列処理を検討（Hangfireのワーカーなど）
- Strategy実行は独立しているため並列化可能

### 多言語対応

- 実績マスタに `Name` / `NameEn`, `Description` / `DescriptionEn` を持つ
- 将来フロントエンドでユーザーのロケールに応じて表示切替可能

### タイムゾーン

- 「早朝タスク完了」等の時刻判定は組織/ユーザーのタイムゾーンを考慮
- `OrganizationSetting.Timezone` を使用

---

## 関連ドキュメント

- [task-motivation-ideas.md](task-motivation-ideas.md) - 要件定義
- [backend-guidelines.md](../backend-guidelines.md) - バックエンド実装ガイドライン
- [frontend-guidelines.md](../frontend-guidelines.md) - フロントエンド実装ガイドライン
- [ssr-design-guidelines.md](../ssr-design-guidelines.md) - SSR設計ガイドライン
