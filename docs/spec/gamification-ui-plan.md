# Pecus Aspire — Gamification（コアティ実績）UI実装計画書

最終更新: 2026-01-12

## 実装進捗サマリー

| 項目 | 状態 |
|------|------|
| API: 実績マスタ取得 | ✅ 完了 |
| API: ユーザー実績取得 | ✅ 完了 |
| API: 未通知バッジ取得・通知済み更新 | ✅ 完了 |
| API: タスク完了時のバッジ情報付与 | ⬜ 未着手 |
| 設定: 組織設定にGamificationEnabled追加 | ✅ 完了 |
| 設定: ユーザー設定にBadgeVisibility追加 | ✅ 完了 |
| UI: バッジコレクションページ | ✅ 完了 |
| UI: ユーザーバッジ表示コンポーネント | ⬜ 未着手 |
| UI: バッジ取得演出コンポーネント | ⬜ 未着手 |
| バッジ画像: 28種 | ✅ 完了 |

---

## 概要

本ドキュメントは [task-motivation-ideas.md](task-motivation-ideas.md) の要件のうちクライアントUIを実装に落とし込むための計画書です。

### スコープ

- **対象機能:** コアティ実績（Achievements）システム

### 除外（今回実装しない）

- メインバッジ機能（ユーザーアバターで代替）
- シークレットバッジの特別表示（未取得は全て「？」表示）
- コンプリート演出

---

## 公開範囲による表示制御

他ユーザーの実績取得時:

1. リクエストユーザーと対象ユーザーの関係を判定
2. 対象ユーザーの `BadgeVisibility` 設定を取得
3. 公開範囲に応じてフィルタリング:
   - `Private`: 本人以外には空配列を返却
   - `Workspace`: 同一ワークスペースメンバーのみ閲覧可
   - `Organization`: 同一組織メンバーのみ閲覧可

---

## バッジ画像

### 格納場所
`pecus.Frontend/public/icons/badge/`

### 命名規則
`{code_in_snake_case}.webp` （例: `early_bird.webp`, `night_owl.webp`）

※ AchievementMaster.IconPath に格納された値をそのまま使用

### 未取得バッジの表示

未取得バッジはAPIレスポンスで情報を隠蔽し、フロントで汎用表示:

- **iconPath**: `null` → `unknown.webp` を表示
- **name / nameEn**: `"???"` を返却
- **description / descriptionEn**: `"???"` を返却

※ `unknown.webp` は汎用シルエット画像として用意

---

## UI実装詳細

### 1. バッジコレクションページ

**パス:** `/profile/achievements`

**機能:**
- 全実績マスタをアルバム風グリッド表示
- 取得済みバッジ: カラー表示 + 名前 + 取得日
- 未取得バッジ: `unknown.webp` + 「???」表示（名前・説明も非公開）
- カテゴリ別フィルタ（任意）

**データ取得:**
- SSR: 全実績マスタ + ログインユーザーの取得済み実績

**API要件:**
- `GET /api/achievements` — 全実績マスタ一覧
- `GET /api/users/me/achievements` — 自分の取得済み実績

---

### 2. ユーザーバッジ表示コンポーネント

**用途:** ユーザーアバタークリック時のポップオーバー等

**機能:**
- 指定ユーザーの取得済みバッジをコンパクト表示
- 公開範囲に基づき表示/非表示制御

**API要件:**
- `GET /api/users/{userId}/achievements` — 指定ユーザーの取得済み実績（公開範囲考慮）

---

### 3. バッジ取得演出コンポーネント

**トリガー:** タスク完了時（ステータス更新APIレスポンス）

**機能:**
- 新規取得バッジがあればモーダル/トースト表示
- 複数同時取得対応（スライドショー or リスト表示）
- 表示後に通知済みマーク

**実装方針:**
- `WorkspaceItemResponse` に `newAchievements` フィールド追加
- フロントエンドでレスポンスを監視、バッジがあれば演出表示
- 表示完了後に `POST /api/users/me/achievements/{id}/notify` を呼び出し

**API要件:**
- タスク更新系API（ステータス更新等）のレスポンスに `newAchievements` 追加
- `POST /api/users/me/achievements/{id}/notify` — 通知済みマーク

---

## 設定ページ追加

### 組織設定（Admin Settings）

**追加フィールド:**
- `GamificationEnabled` — Gamification機能の有効/無効（トグル）

**場所:** `AdminSettingsClient.tsx`

---

### ユーザー設定（Profile Settings）

**追加フィールド:**
- `BadgeVisibility` — バッジ公開範囲（セレクト: Private/Workspace/Organization）
  - 組織設定 `GamificationAllowUserOverride = false` の場合は非表示または無効化

**場所:** `UserSettingsClient.tsx`

---

## API設計

### 実績マスタ取得（コレクション用）

```
GET /api/achievements
Response: AchievementCollectionDto[]
```

未取得バッジは情報を隠蔽:
```typescript
interface AchievementCollectionDto {
  id: number;
  code: string;
  name: string;           // 未取得: "???"
  nameEn: string;         // 未取得: "???"
  description: string;    // 未取得: "???"
  descriptionEn: string;  // 未取得: "???"
  iconPath: string | null; // 未取得: null
  difficulty: AchievementDifficulty;
  category: AchievementCategory;
  isEarned: boolean;      // 取得済みフラグ
  earnedAt: string | null; // 取得日時（未取得: null）
}
```

### ユーザー実績取得（自分）

```
GET /api/users/me/achievements
Response: UserAchievementDto[]
```

### ユーザー実績取得（他ユーザー）

```
GET /api/users/{userId}/achievements
Response: UserAchievementDto[]  // 公開範囲に基づきフィルタ
```

### 通知済みマーク

```
POST /api/users/me/achievements/{achievementId}/notify
Response: 204 No Content
```

### タスク更新レスポンス拡張

```typescript
interface WorkspaceItemResponse {
  success: boolean;
  message: string;
  workspaceItem: WorkspaceItemDetailResponse;
  newAchievements?: NewAchievementDto[];  // 追加
}

interface NewAchievementDto {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  iconPath: string | null;
  difficulty: AchievementDifficulty;
  category: AchievementCategory;
  earnedAt: string;
}
```

---

## 実装順序（推奨）

1. **バックエンドAPI**
   - AchievementController 作成
   - DTO 作成
   - 公開範囲制御ロジック

2. **タスク完了時のバッジ情報付与**
   - WorkspaceItemService 拡張
   - WorkspaceItemResponse 拡張

3. **設定ページ**
   - 組織設定: GamificationEnabled
   - ユーザー設定: BadgeVisibility

4. **フロントエンドUI**
   - バッジコレクションページ
   - バッジ取得演出コンポーネント
   - ユーザーバッジ表示コンポーネント

5. **バッジ画像**
   - 28種 + unknown.svg

---

## 関連ドキュメント

- [task-motivation-ideas.md](task-motivation-ideas.md) - 要件定義
- [gamification-implementation-plan.md](gamification-implementation-plan.md) - バックエンド側の仕組み
- [backend-guidelines.md](../backend-guidelines.md) - バックエンド実装ガイドライン
- [frontend-guidelines.md](../frontend-guidelines.md) - フロントエンド実装ガイドライン
- [ssr-design-guidelines.md](../ssr-design-guidelines.md) - SSR設計ガイドライン
