# SSR設計ガイドライン

## AI エージェント向け要約（必読）

- **コンテキスト**: Next.js App Router (Server Components) の設計指針。
- **重要ルール**:
  - **デフォルト**: 原則 Server Component (`page.tsx`, `layout.tsx`) で実装。
  - **Client Component**: `useState`, `useEffect`, `onClick` が必要な場合のみ `"use client"` を使用し、末端のコンポーネントとして切り出す。
  - **データ取得**: 初期データは Server Component で `createPecusApiClients` を使って取得し、Props で Client Component に渡す。
  - **禁止事項**: `page.tsx` 全体を `"use client"` にすること。Server Component で `useState` を使うこと。
- **関連ファイル**: `docs/frontend-guidelines.md`

## 概要

このドキュメントは、Next.js App Router におけるServer Components（SSR）とClient Componentsの適切な使い分けを定義します。

## 基本原則

### SSRの目的

1. **初期表示の高速化**: サーバーで生成したHTMLを即座にクライアントに返し、ユーザーが早くコンテンツを見られるようにする
2. **JavaScript依存の軽減**: 静的な部分はJSのロード・ハイドレーションを待たずに表示
3. **SEO向上**: クローラーが読み取れる完全なHTMLを提供

### 黄金ルール

> **「サーバーでできることはサーバーで行う」**

- 静的なUI構造（ヘッダー、サイドバー、タイトル、ラベル等）は Server Component でレンダリング
- Client Component は **インタラクションが必要な部分のみ** に限定
- 初期データは SSR で取得し、HTMLに含めて返す

### ❌ アンチパターン
- トランザクションデータをSSRで取得する。
- マスターデータなど変化の少ないデータをCSRで取得する。
- 更新時に必要なRowVersionをSSRで取得する。
- 呼び出し側のページでトランザクションデータを取得し呼び出しがに渡す。

### ✅ 正しいパターン
- トランザクションデータは必ずCSRで取得する。
- マスターデータなど変化の少ないデータをSSRで取得する（100%普遍ではないのでケースバイケース）
- 更新時に必要なRowVersionは必ずCSRで取得する。
- トランザクションデータは呼び出された側のコンポーネントで取得する。

## コンポーネント分類

### Server Component で実装すべきもの

| 種類 | 例 | 理由 |
|------|-----|------|
| ページレイアウト | ヘッダー、フッター、サイドバーの構造 | 静的、インタラクション不要 |
| ページタイトル・見出し | `<h1>マイワークスペース</h1>` | 静的テキスト |
| 説明文・ラベル | 説明テキスト、フォームラベル | 静的テキスト |
| 初期データの表示 | リスト初期表示、詳細情報 | SSRで取得→即座に表示 |
| アイコン（静的） | ナビゲーションアイコン | 状態変化なし |
| リンク | `<Link href="...">` | Next.js Link は Server Component 対応 |

### Client Component で実装すべきもの

| 種類 | 例 | 理由 |
|------|-----|------|
| フォーム入力 | テキスト入力、セレクトボックス | ユーザー入力を受け取る |
| ボタン操作 | 送信、削除、切り替え | onClick ハンドラーが必要 |
| 状態管理 | フィルター、ソート、ページネーション | useState/useReducer が必要 |
| 無限スクロール | 追加データ読み込み | IntersectionObserver、状態管理が必要 |
| モーダル/ドロップダウン | 開閉状態の管理 | useState が必要 |
| リアルタイム更新 | WebSocket、SignalR連携 | イベントリスナーが必要 |
| アニメーション | Framer Motion等 | クライアントサイドAPI使用 |

## ファイル構成パターン

### 推奨構成

```
app/
  (dashboard)/
    workspaces/
      page.tsx                    # Server Component - レイアウト + 初期データ取得
      _components/
        WorkspaceList.tsx         # Server Component - リスト構造のレンダリング
        WorkspaceListClient.tsx   # Client Component - フィルター・無限スクロール
        WorkspaceCard.tsx         # Server Component - 個別カードの静的部分
        WorkspaceCardActions.tsx  # Client Component - カードのアクションボタン
```

### 命名規則

- `xxxClient.tsx`: Client Component（`'use client'` ディレクティブあり）
- `xxx.tsx`: Server Component（デフォルト）

## 実装パターン

### ❌ アンチパターン（現状の問題）

```tsx
// page.tsx
export default async function WorkspacesPage() {
  const user = await fetchUser();
  const genres = await fetchGenres();

  // 問題: 全てをClient Componentに丸投げ
  // → SSRでレンダリングできる部分がHTMLに含まれない
  // → JSロード完了まで白画面
  return <WorkspacesClient user={user} genres={genres} />;
}

// WorkspacesClient.tsx
'use client';
export function WorkspacesClient({ user, genres }) {
  const [workspaces, setWorkspaces] = useState([]);

  // 問題: Client側で再度データをfetch
  // → 二重取得、初期表示が遅い
  useEffect(() => {
    fetchWorkspaces().then(setWorkspaces);
  }, []);

  return (
    <div>
      <h1>マイワークスペース</h1>  {/* これはSSRで返せる */}
      <p>説明文...</p>              {/* これもSSRで返せる */}
      {/* リスト表示... */}
    </div>
  );
}
```

### ✅ 推奨パターン

```tsx
// page.tsx (Server Component)
export default async function WorkspacesPage() {
  const api = createPecusApiClients();

  // 並列でデータ取得（SSR）
  const [userResponse, genres, initialWorkspaces] = await Promise.all([
    api.profile.getApiProfile(),
    api.master.getApiMasterGenres(),
    api.workspace.getApiWorkspacesPaged({ page: 1, pageSize: 20 })
  ]);

  const user = mapUserResponseToUserInfo(userResponse);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* 静的な構造はSSRでレンダリング */}
      <AppHeader userInfo={user} />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar isAdmin={user.isAdmin} />

        <main className="flex-1 p-4 md:p-6 bg-base-100 overflow-y-auto">
          {/* 静的なタイトル・説明文 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">マイワークスペース</h1>
            <p className="text-base-content/70 mt-1">
              アクセス可能なワークスペースの一覧です
            </p>
          </div>

          {/* 初期データを含めた静的リスト + インタラクティブ部分 */}
          <WorkspaceListClient
            initialData={initialWorkspaces.data}
            initialPagination={{
              currentPage: initialWorkspaces.currentPage,
              totalPages: initialWorkspaces.totalPages,
              hasMore: initialWorkspaces.hasMore
            }}
            genres={genres}
          />
        </main>
      </div>
    </div>
  );
}

// WorkspaceListClient.tsx (Client Component)
'use client';
export function WorkspaceListClient({
  initialData,
  initialPagination,
  genres
}: Props) {
  // 初期データをそのまま使用（再fetchしない）
  const [workspaces, setWorkspaces] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);

  // 追加データのみfetch（無限スクロール時）
  const loadMore = async () => {
    const result = await getWorkspacesPaged(pagination.currentPage + 1);
    setWorkspaces(prev => [...prev, ...result.data]);
    setPagination(result.pagination);
  };

  return (
    <>
      {/* フィルターUI（インタラクティブ） */}
      <WorkspaceFilters genres={genres} onFilterChange={handleFilter} />

      {/* リスト表示 */}
      <div className="grid gap-4">
        {workspaces.map(ws => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
      </div>

      {/* 無限スクロール */}
      {pagination.hasMore && <LoadMoreSentinel onIntersect={loadMore} />}
    </>
  );
}
```

## コンポーネント分割の判断フロー

```
このコンポーネントは...
  │
  ├─ useState/useEffect/useRef を使う？
  │     └─ Yes → Client Component
  │
  ├─ onClick/onChange 等のイベントハンドラーを持つ？
  │     └─ Yes → Client Component
  │
  ├─ ブラウザAPIを使う？（localStorage, window, document等）
  │     └─ Yes → Client Component
  │
  ├─ サードパーティライブラリがクライアント専用？
  │     └─ Yes → Client Component
  │
  └─ 上記全てNo
        └─ Server Component
```

## 共通コンポーネントの扱い

### AppHeader / DashboardSidebar

現状これらが `'use client'` の場合、以下の対応を検討：

1. **構造と動作の分離**
   ```tsx
   // AppHeaderLayout.tsx (Server Component)
   export function AppHeaderLayout({ children, userInfo }) {
     return (
       <header className="...">
         <Logo />
         <nav>{/* 静的ナビゲーション */}</nav>
         {children} {/* インタラクティブ部分 */}
       </header>
     );
   }

   // AppHeaderActions.tsx (Client Component)
   'use client';
   export function AppHeaderActions({ userInfo }) {
     // ドロップダウン、通知等のインタラクティブ部分
   }
   ```

2. **page.tsx での組み合わせ**
   ```tsx
   <AppHeaderLayout userInfo={user}>
     <AppHeaderActions userInfo={user} />
   </AppHeaderLayout>
   ```

## パフォーマンス指標

### 改善前後の比較（期待値）

| 指標 | 改善前 | 改善後 |
|------|--------|--------|
| FCP (First Contentful Paint) | JSロード後 | 即座 |
| LCP (Largest Contentful Paint) | 大幅遅延 | 改善 |
| TTI (Time to Interactive) | 変化なし | 変化なし |
| JavaScript バンドルサイズ | 大 | 削減 |

## チェックリスト

### page.tsx 作成時

- [ ] 静的な構造（タイトル、説明文、レイアウト）は Server Component でレンダリングしているか
- [ ] 初期データは `page.tsx` で取得し、Client Component に `initialData` として渡しているか
- [ ] Client Component は本当にインタラクションが必要な部分のみか
- [ ] データの二重取得が発生していないか

### Client Component 作成時

- [ ] `'use client'` は本当に必要か（useState/useEffect/イベントハンドラーがあるか）
- [ ] 静的な部分を含んでいないか（含んでいれば分離を検討）
- [ ] `initialData` を受け取り、初期表示で再fetchしていないか

## 関連ドキュメント

- [frontend-guidelines.md](./frontend-guidelines.md) - フロントエンド全般のガイドライン
- [ui-component-guidelines.md](./ui-component-guidelines.md) - UIコンポーネント設計
- [use-infinite-scroll.md](./use-infinite-scroll.md) - 無限スクロール実装
