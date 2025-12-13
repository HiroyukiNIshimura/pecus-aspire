# useInfiniteScroll フック

IntersectionObserver を利用した無限スクロールのカスタムフック。

## 概要

`react-infinite-scroll-component` の代替として作成。Body スクロールと特定のスクロールコンテナの両方に対応。

## インポート

```tsx
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
```

## 基本的な使い方

### Body スクロール（デフォルト）

ページ全体のスクロールで無限読み込みを行う場合。

```tsx
const { sentinelRef, isLoading, reset } = useInfiniteScroll({
  onLoadMore: loadMoreItems,
  hasMore: currentPage < totalPages,
});

return (
  <>
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </div>

    {/* センチネル要素 - リストの最後に配置 */}
    <div ref={sentinelRef} aria-hidden="true" />

    {/* ローディング表示 */}
    {isLoading && <Spinner />}

    {/* 終了メッセージ */}
    {!isLoading && !hasMore && <p>すべて表示しました</p>}
  </>
);
```

### スクロールコンテナ指定

サイドバーなど特定の要素内でスクロールする場合。

```tsx
const scrollContainerRef = useRef<HTMLDivElement>(null);

const { sentinelRef, isLoading } = useInfiniteScroll({
  onLoadMore: loadMoreItems,
  hasMore: currentPage < totalPages,
  scrollContainerRef, // コンテナを指定
});

return (
  <div
    ref={scrollContainerRef}
    className="overflow-y-auto"
    style={{ maxHeight: '500px' }}
  >
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
    <div ref={sentinelRef} aria-hidden="true" />
    {isLoading && <Spinner />}
  </div>
);
```

## オプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `onLoadMore` | `() => Promise<void>` | 必須 | 次のページを読み込む関数 |
| `hasMore` | `boolean` | 必須 | まだ読み込むデータがあるか |
| `rootMargin` | `string` | `'100px'` | 先読み距離。センチネルがこの距離に入ったら読み込み開始 |
| `threshold` | `number` | `0` | IntersectionObserver の threshold |
| `scrollContainerRef` | `RefObject<HTMLElement>` | `null` | スクロールコンテナの ref（省略時は Body） |
| `disabled` | `boolean` | `false` | 一時的に無効化 |

## 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `sentinelRef` | `RefCallback<HTMLElement>` | センチネル要素に設定する ref |
| `isLoading` | `boolean` | 現在読み込み中かどうか |
| `reset` | `() => void` | 状態をリセット（フィルター変更時などに使用） |

## フィルター変更時のリセット

フィルターや検索条件を変更してリストをリフレッシュする場合、`reset()` を呼び出す。

```tsx
const { sentinelRef, isLoading, reset } = useInfiniteScroll({
  onLoadMore: loadMoreItems,
  hasMore: currentPage < totalPages,
});

const handleFilterChange = async (newFilter: string) => {
  reset(); // 無限スクロールの状態をリセット
  setFilter(newFilter);
  const result = await fetchItems(1, newFilter);
  setItems(result.data);
  setCurrentPage(1);
  setTotalPages(result.totalPages);
};
```

## 実装例

### WorkspacesClient.tsx（Body スクロール）

```tsx
const { sentinelRef, isLoading: isLoadingMore, reset: resetInfiniteScroll } = useInfiniteScroll({
  onLoadMore: async () => {
    await loadMoreWorkspaces();
  },
  hasMore: totalPages > 1 && currentPage < totalPages,
  rootMargin: '200px',
});
```

### WorkspaceItemsSidebar.tsx（コンテナスクロール）

```tsx
const scrollContainerRef = useRef<HTMLDivElement>(null);

const { sentinelRef, isLoading: isLoadingMore, reset: resetInfiniteScroll } = useInfiniteScroll({
  onLoadMore: loadMoreItems,
  hasMore: currentPage < totalPages,
  rootMargin: '100px',
  scrollContainerRef,
});
```

## 注意事項

- センチネル要素は必ずリストの**最後**に配置する
- `onLoadMore` 内でエラーが発生しても `isLoading` は `false` に戻る
- 重複リクエストは内部で防止される（ローディング中は再発火しない）
- `hasMore` が `false` の場合、Observer は発火しない
