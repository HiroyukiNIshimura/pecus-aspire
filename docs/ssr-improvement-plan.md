# SSR改善プラン

## 概要

このドキュメントは `docs/ssr-design-guidelines.md` に基づき、現在のフロントエンド実装をSSR最適化するための改善プランです。

## 現状分析

### 問題点サマリー

| ページ/コンポーネント | 問題点 |
|----------------------|--------|
| 全ダッシュボードページ | `page.tsx` が `xxxClient.tsx` に全て丸投げ。静的UI部分がClient内にありSSR不可 |
| `AppHeader` | `'use client'` だが、ロゴ・ナビリンク等の静的部分が多い |
| `DashboardSidebar` | `'use client'` だが、`usePathname()` のみ。メニュー構造自体は静的 |
| `WorkspacesClient` | `useEffect` で `/api/workspaces` を再fetch（二重取得） |
| `DashboardClient` | SSRで取得したデータを受け取るが、レイアウト全体がClient |

### 影響を受けるファイル

```
pecus.Frontend/src/
├── components/common/
│   ├── AppHeader.tsx              # 分離対象
│   └── DashboardSidebar.tsx       # 分離対象
├── app/(dashbord)/
│   ├── layout.tsx                 # 改善対象
│   ├── page.tsx                   # 改善対象
│   ├── DashboardClient.tsx        # スリム化対象
│   ├── workspaces/
│   │   ├── page.tsx               # 改善対象
│   │   └── WorkspacesClient.tsx   # スリム化対象
│   ├── my-items/
│   │   ├── page.tsx               # 改善対象
│   │   └── MyItemsClient.tsx      # スリム化対象
│   └── admin/
│       └── workspaces/
│           ├── page.tsx           # 改善対象
│           └── AdminWorkspacesClient.tsx  # スリム化対象
```

---

## 改善プラン

### Phase 1: 共通コンポーネントの分離（優先度: 高）

**目標**: `AppHeader` と `DashboardSidebar` をServer Component対応に

#### 1-1. DashboardSidebar の分離

**現状**:
```
DashboardSidebar.tsx ('use client')
└─ usePathname() でアクティブ状態を判定
```

**改善後**:
```
├─ DashboardSidebar.tsx (Server Component) - メニュー構造
└─ SidebarNavItem.tsx ('use client') - アクティブ状態のハイライトのみ
```

**作業内容**:
- [x] メニュー項目のレンダリングを Server Component に移動
- [x] `usePathname()` を使うアクティブ判定のみを `SidebarNavItem.tsx` に分離
- [x] アイコン・ラベル・リンク構造は Server Component でレンダリング

#### 1-2. AppHeader の分離

**現状**:
```
AppHeader.tsx ('use client')
└─ usePathname(), useTheme(), ログアウト処理
```

**改善後**:
```
├─ AppHeader.tsx (Server Component) - ロゴ、ナビ構造
├─ AppHeaderNav.tsx ('use client') - アクティブ状態判定（必要な場合）
├─ ThemeToggle.tsx ('use client') - テーマ切り替え
└─ UserMenu.tsx ('use client') - ユーザーメニュー・ログアウト
```

**作業内容**:
- [x] 静的なロゴ・ナビ構造を Server Component に移動
- [x] テーマ切り替えを `ThemeToggle.tsx` に分離
- [x] ユーザーメニュー・ログアウトを `UserMenu.tsx` に分離
- [x] アクティブ状態判定が必要な場合は `HeaderNavItem.tsx` に分離

---

### Phase 2: 共通レイアウトの作成（優先度: 高）

**目標**: ダッシュボード系ページ共通のレイアウトをServer Componentで提供

#### 2-1. DashboardLayout の改善

**現状**:
```tsx
// layout.tsx
export default function DashboardLayout({ children }) {
  return <>{children}</>;  // 実質何もしていない
}
```

**改善後**:
```tsx
// layout.tsx (Server Component)
export default async function DashboardLayout({ children }) {
  const user = await getUser();

  return (
    <div className="flex flex-col h-screen">
      <AppHeader userInfo={user} />
      <div className="flex flex-1">
        <DashboardSidebar isAdmin={user.isAdmin} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
```

**作業内容**:
- [x] `layout.tsx` でユーザー情報を取得
- [x] `AppHeader` と `DashboardSidebar` を layout で配置
- [x] 各ページの `page.tsx` / `xxxClient.tsx` からヘッダー・サイドバーを削除

**追加作業**（2025-01-20実施）:
- [x] `(workspace-full)` ルートグループ作成 - ワークスペース詳細の独自レイアウト対応
- [x] `/workspaces/[code]` を `(workspace-full)` に移動
- [x] `EditWorkspaceModal`, `EditWorkspaceSkillsModal` を `@/components/workspaces` に移動（共有化）

---

### Phase 3: 個別ページの改善（優先度: 中）

#### 優先順位

| 順序 | ページ | 理由 |
|------|--------|------|
| 1 | `/workspaces` | 二重fetch問題あり、改善効果大 |
| 2 | `/` (Dashboard) | トップページ、ユーザー体験に直結 |
| 3 | `/my-items` | 比較的シンプル、パターン確立後に対応 |
| 4 | `/workspaces/[code]` | 複雑、Phase 3後半で対応 |
| 5 | `/admin/*` | 管理者のみ、優先度低 |

#### 3-1. WorkspacesPage の改善

**現状**:
```
page.tsx
└─ WorkspacesClient.tsx (全て)
    └─ useEffect で /api/workspaces を fetch
```

**改善後**:
```
page.tsx (Server Component)
├─ 静的タイトル・説明文 (SSR)
├─ 初期データ取得 (workspaces, genres)
└─ WorkspaceListClient.tsx (フィルター・無限スクロールのみ)
```

**作業内容**:
- [ ] `page.tsx` で `getApiWorkspacesPaged()` を呼び、初期データをSSRで返す
- [ ] `WorkspacesClient.tsx` → `WorkspaceListClient.tsx` にリネーム・スリム化
- [ ] `useEffect` での初回fetch削除
- [ ] 静的なタイトル・説明文を `page.tsx` に移動

#### 3-2. DashboardPage の改善

**現状**:
```
page.tsx
└─ DashboardClient.tsx (全て)
```

**改善後**:
```
page.tsx (Server Component)
├─ 静的タイトル・グリッド構造 (SSR)
├─ 統計データ取得
└─ DashboardWidgets (必要に応じてClient)
```

**作業内容**:
- [ ] ダッシュボードカードの静的構造をSSRに移動
- [ ] インタラクティブな部分のみClient Componentに
- [ ] 各ウィジェットがServer Component化可能か確認

#### 3-3. MyItemsPage の改善

**現状**:
```
page.tsx
└─ MyItemsClient.tsx (全て)
```

**改善後**:
```
page.tsx (Server Component)
├─ 静的タイトル・説明文 (SSR)
├─ 初期データ取得
└─ MyItemsListClient.tsx (フィルター・操作のみ)
```

**作業内容**:
- [ ] ページタイトル・説明をSSRに移動
- [ ] Client Component をリスト操作部分のみに限定

#### 3-4. 他ページの改善

残りのページも同様のパターンで改善:
- [ ] `/workspaces/[code]`
- [ ] `/admin/workspaces`
- [ ] `/admin/users`
- [ ] `/activity`
- [ ] その他

---

### Phase 4: テンプレート・チェックリスト整備（優先度: 低）

**目標**: 今後の開発で同じパターンを踏襲できるようにする

**作業内容**:
- [ ] 新規ページ作成用のテンプレートファイル作成
- [ ] コードレビュー用チェックリストの追加
- [ ] `docs/ssr-design-guidelines.md` に具体例を追加

---

## 作業見積もり

| Phase | 作業 | 見積もり | 影響範囲 |
|-------|------|---------|---------|
| 1-1 | DashboardSidebar分離 | 2h | 全ダッシュボードページ |
| 1-2 | AppHeader分離 | 3h | 全ダッシュボードページ |
| 2-1 | DashboardLayout改善 | 2h | 全ダッシュボードページ |
| 3-1 | WorkspacesPage改善 | 3h | `/workspaces` |
| 3-2 | DashboardPage改善 | 2h | `/` |
| 3-3 | MyItemsPage改善 | 2h | `/my-items` |
| 3-4 | 他ページ改善 | 6h | 残りのページ |
| 4 | テンプレート整備 | 1h | - |

**合計: 約21時間**

---

## 実行スケジュール（推奨）

```
Week 1:
├─ Phase 1 完了 (共通コンポーネント分離)
└─ Phase 2 完了 (共通レイアウト)

Week 2:
├─ Phase 3-1 (WorkspacesPage)
├─ Phase 3-2 (DashboardPage)
└─ Phase 3-3 (MyItemsPage)

Week 3:
├─ Phase 3-4 (残りのページ)
└─ Phase 4 (テンプレート整備)
```

---

## 注意事項

### 後方互換性
- 既存の機能を壊さないよう、各Phaseごとに動作確認
- 特にログイン状態、リダイレクト処理に注意

### 段階的リリース
- Phase 1-2 完了後に一度リリース、効果測定
- 問題があれば早期に検出

### テスト方法
- 各ページのSSRレンダリング結果を確認
  ```bash
  curl -s http://localhost:3000/workspaces | head -100
  ```
- JSなしでHTMLが返るか確認
- Lighthouse でパフォーマンス測定

### 依存関係
- Phase 2 は Phase 1 完了後に着手
- Phase 3 は Phase 2 完了後に着手（レイアウト変更が前提）

---

## 進捗管理

### Phase 1 ✅ 完了 (2024-12-14)
- [x] 1-1. DashboardSidebar分離
  - `SidebarNavItem.tsx` (Client) 作成 - アクティブ状態判定
  - `DashboardSidebar.tsx` を Server Component 化
- [x] 1-2. AppHeader分離
  - `ThemeToggle.tsx` (Client) 作成 - テーマ切り替え
  - `UserMenu.tsx` (Client) 作成 - ユーザーメニュー・ログアウト
  - `HeaderNavItem.tsx` (Client) 作成 - ナビアクティブ状態判定
  - `HeaderLogo.tsx` (Client) 作成 - テーマ対応ロゴ
  - `MobileMenuButton.tsx` (Client) 作成 - ハンバーガーメニュー
  - `AppHeader.tsx` を分離コンポーネント使用に変更

### Phase 2
- [ ] 2-1. DashboardLayout改善

### Phase 3
- [ ] 3-1. WorkspacesPage改善
- [ ] 3-2. DashboardPage改善
- [ ] 3-3. MyItemsPage改善
- [ ] 3-4. 他ページ改善

### Phase 4
- [ ] テンプレート・チェックリスト整備

---

## 関連ドキュメント

- [ssr-design-guidelines.md](./ssr-design-guidelines.md) - SSR設計ガイドライン
- [frontend-guidelines.md](./frontend-guidelines.md) - フロントエンド全般のガイドライン
- [ui-component-guidelines.md](./ui-component-guidelines.md) - UIコンポーネント設計
