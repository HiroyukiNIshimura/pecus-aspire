# Pecus Aspire — Gamification（コアティ実績）実装計画書

最終更新: 2026-01-11

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
    Communication = 3,  // コミュニケーション（光速のレスポンダー）
    AI = 4,             // AI活用（AI使いの弟子）
    TeamPlay = 5        // チームプレイ（沈黙の守護者）
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
        ├── InboxZeroStrategy.cs          # Inbox Zero
        ├── TaskChefStrategy.cs           # タスク料理人
        ├── SonicReplyStrategy.cs         # 光速のレスポンダー
        ├── AiApprenticeStrategy.cs       # AI使いの弟子
        ├── WeekendGuardianStrategy.cs    # 週末の聖域
        └── UnsungHeroStrategy.cs         # 沈黙の守護者
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

## Phase 2: API 設計

### 2.1 エンドポイント一覧

| Endpoint | Method | 説明 | 認証 |
|----------|--------|------|------|
| `/api/achievements` | GET | 全実績マスタ一覧 | 要認証 |
| `/api/users/{userId}/achievements` | GET | ユーザーの獲得実績一覧 | 要認証 |
| `/api/users/{userId}/achievements/main-badge` | PUT | メインバッジ設定 | 本人のみ |
| `/api/users/{userId}/achievements/pending` | GET | 未通知の実績一覧 | 本人のみ |
| `/api/users/{userId}/achievements/{id}/notify` | POST | 通知済みマーク | 本人のみ |
| `/api/users/{userId}/settings/badge-visibility` | PUT | 公開範囲設定 | 本人のみ |

### 2.2 DTO 設計

#### AchievementMasterDto

```csharp
public record AchievementMasterDto(
    int Id,
    string Code,
    string Name,
    string NameEn,
    string Description,
    string DescriptionEn,
    string? IconPath,
    AchievementDifficulty Difficulty,
    AchievementCategory Category,
    bool IsSecret,
    int SortOrder
);
```

#### UserAchievementDto

```csharp
public record UserAchievementDto(
    int Id,
    int AchievementMasterId,
    AchievementMasterDto Achievement,
    DateTimeOffset EarnedAt,
    bool IsMainBadge
);
```

#### SetMainBadgeRequest

```csharp
public record SetMainBadgeRequest(
    [Required] int AchievementMasterId
);
```

### 2.3 公開範囲による表示制御

他ユーザーの実績取得時（`GET /api/users/{userId}/achievements`）:

1. リクエストユーザーと対象ユーザーの関係を判定
2. 対象ユーザーの `BadgeVisibility` 設定を取得
3. 公開範囲に応じてフィルタリング:
   - `Private`: 本人以外には空配列を返却
   - `Workspace`: 同一ワークスペースメンバーのみ閲覧可
   - `Organization`: 同一組織メンバーのみ閲覧可

---

## Phase 3: フロントエンド実装

### 3.1 ページ構成

| パス | 説明 | SSR/CSR |
|------|------|---------|
| `/achievements` | 実績一覧ページ（アルバム形式） | SSR |
| `/profile/[userId]` | プロフィール（メインバッジ表示） | SSR |
| `/settings/achievements` | 実績設定（公開範囲、メインバッジ） | SSR + CSR |

### 3.2 Server Actions

```
src/actions/achievements/
├── getAchievementMasters.ts      # 実績マスタ取得
├── getUserAchievements.ts        # ユーザー実績取得
├── setMainBadge.ts               # メインバッジ設定
├── getPendingAchievements.ts     # 未通知実績取得
├── markAchievementNotified.ts    # 通知済みマーク
└── updateBadgeVisibility.ts      # 公開範囲設定
```

### 3.3 UI コンポーネント

| コンポーネント | 説明 |
|----------------|------|
| `AchievementBadge.tsx` | バッジ表示（ロック/アンロック状態対応） |
| `AchievementCollection.tsx` | アルバム形式の一覧（グリッド表示） |
| `AchievementUnlockToast.tsx` | 獲得時のアニメーション演出 |
| `MainBadgeSelector.tsx` | メインバッジ選択モーダル |
| `BadgeVisibilitySelector.tsx` | 公開範囲設定UI |
| `ProfileBadge.tsx` | プロフィールに表示するメインバッジ |

### 3.4 Piggyback 通知フロー（フロントエンド）

```
1. タスク完了API呼び出し
2. CompleteTaskTask（Hangfire）が実行される
3. SignalR経由で以下を受信:
   a. タスク完了の応援メッセージ（既存）
   b. 未通知の実績獲得通知（新規）
4. フロントエンドで演出:
   a. 応援メッセージをDMに表示
   b. 実績獲得Toast/モーダルを表示
5. 通知済みマークAPIを呼び出し
```

---

## Phase 4: AI連携（隠し実績）

### 4.1 シークレットバッジの判定フロー

```
1. AchievementEvaluationTask実行時
2. IsSecret=trueの実績に対して:
   a. IAiClientFactory経由でAI分析を呼び出し
   b. ユーザーの行動パターンを分析
   c. 条件を満たすユーザーを特定
3. 通常の実績と同様にUserAchievementsに保存
```

### 4.2 AI分析対象データ

- タスク完了パターン（時間帯、頻度、内容）
- コメント応答パターン（速度、丁寧さ）
- Bot/AI機能の利用状況
- チーム内での依存関係解消への貢献度

---

## 実装スケジュール（推奨順序）

### Week 1-2: DB & バックエンド基盤

1. [ ] Entity作成（AchievementMaster, UserAchievement）
2. [ ] Enum定義（AchievementDifficulty, AchievementCategory, BadgeVisibility）
3. [ ] OrganizationSetting, UserSetting への項目追加
4. [ ] DbContext登録 & Migration実行
5. [ ] Seed データ投入（初期実績マスタ）

### Week 3-4: Strategy パターン & バッチ

6. [ ] IAchievementStrategy インターフェース定義
7. [ ] 容易な実績のStrategy実装（EarlyBird, InboxZero, TaskChef）
8. [ ] AchievementEvaluator実装
9. [ ] AchievementEvaluationTask実装
10. [ ] RecurringJob登録

### Week 5: API実装

11. [ ] DTO作成
12. [ ] AchievementController実装
13. [ ] 公開範囲による表示制御実装
14. [ ] OpenAPI生成 & フロントエンドクライアント更新

### Week 6: Piggyback通知

15. [ ] CompleteTaskTask拡張
16. [ ] SignalR通知ロジック追加

### Week 7-8: フロントエンド

17. [ ] Server Actions実装
18. [ ] 実績一覧ページ実装
19. [ ] UIコンポーネント実装
20. [ ] 獲得時アニメーション実装
21. [ ] 設定ページ実装

### Week 9: AI連携 & 中高難易度Strategy

22. [ ] 中難易度Strategy実装（SonicReply, AiApprentice）
23. [ ] 高難易度Strategy実装（WeekendGuardian, UnsungHero）
24. [ ] シークレットバッジのAI判定実装

### Week 10: テスト & リリース準備

25. [ ] 単体テスト作成
26. [ ] 統合テスト作成
27. [ ] ドキュメント更新
28. [ ] リリース

---

## 注意事項

### プロジェクトルール遵守

- **API クライアント生成（`npm run full:api`）の実行禁止** — 人間の開発者のみが実行
- **フロントからの WebApi 直 fetch 禁止** — Server Actions 経由のみ
- **Hangfire タスクは DI 経由** — 静的メソッド禁止
- **DTO に検証属性必須** — `[Required]`, `[MaxLength]` 等

### パフォーマンス考慮

- 夜間バッチは組織ごとに分割実行を検討
- 大量ユーザー組織では並列処理を検討
- Strategy実行は独立しているため並列化可能

### 多言語対応

- 実績マスタに `Name` / `NameEn`, `Description` / `DescriptionEn` を持つ
- フロントエンドでユーザーのロケールに応じて表示切替

### タイムゾーン

- 「早朝タスク完了」等の時刻判定は組織/ユーザーのタイムゾーンを考慮
- `OrganizationSetting.Timezone` を使用

---

## 関連ドキュメント

- [task-motivation-ideas.md](task-motivation-ideas.md) - 要件定義
- [backend-guidelines.md](../backend-guidelines.md) - バックエンド実装ガイドライン
- [frontend-guidelines.md](../frontend-guidelines.md) - フロントエンド実装ガイドライン
- [ssr-design-guidelines.md](../ssr-design-guidelines.md) - SSR設計ガイドライン
