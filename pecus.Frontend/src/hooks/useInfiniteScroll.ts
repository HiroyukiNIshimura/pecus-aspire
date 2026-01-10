'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseInfiniteScrollOptions {
  /**
   * 次のページを読み込む関数
   */
  onLoadMore: () => Promise<void>;
  /**
   * まだ読み込むデータがあるか
   */
  hasMore: boolean;
  /**
   * IntersectionObserver の rootMargin（デフォルト: '100px'）
   * センチネルがビューポートに近づいた時点で先読みする
   */
  rootMargin?: string;
  /**
   * IntersectionObserver の threshold（デフォルト: 0）
   */
  threshold?: number;
  /**
   * スクロールコンテナの ref（指定しない場合は viewport/body を使用）
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /**
   * 無効化フラグ（フィルター変更中など一時的に無効にしたい場合）
   */
  disabled?: boolean;
}

export interface UseInfiniteScrollReturn {
  /**
   * センチネル要素に設定する ref
   */
  sentinelRef: React.RefCallback<HTMLElement>;
  /**
   * 現在読み込み中かどうか
   */
  isLoading: boolean;
  /**
   * 手動でリセットする関数（フィルター変更時などに使用）
   */
  reset: () => void;
}

/**
 * IntersectionObserver を利用した無限スクロールフック
 *
 * @example
 * // Body スクロールを使用する場合
 * const { sentinelRef, isLoading } = useInfiniteScroll({
 *   onLoadMore: loadMoreItems,
 *   hasMore: currentPage < totalPages,
 * });
 *
 * return (
 *   <>
 *     <div className="grid">
 *       {items.map(item => <Card key={item.id} />)}
 *     </div>
 *     <div ref={sentinelRef} aria-hidden="true" />
 *     {isLoading && <Spinner />}
 *   </>
 * );
 *
 * @example
 * // 特定のスクロールコンテナを使用する場合
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { sentinelRef, isLoading } = useInfiniteScroll({
 *   onLoadMore: loadMoreItems,
 *   hasMore: currentPage < totalPages,
 *   scrollContainerRef: containerRef,
 * });
 *
 * return (
 *   <div ref={containerRef} className="overflow-y-auto h-96">
 *     {items.map(item => <Card key={item.id} />)}
 *     <div ref={sentinelRef} aria-hidden="true" />
 *   </div>
 * );
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  rootMargin = '100px',
  threshold = 0,
  scrollContainerRef,
  disabled = false,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);

  // onLoadMore を ref に保持して、依存配列から除外できるようにする
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  // hasMore を ref に保持（Observer コールバック内で最新値を参照するため）
  const hasMoreRef = useRef(hasMore);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // ローディング状態を ref でも保持（重複リクエスト防止）
  const isLoadingRef = useRef(false);

  // リセットカウンター（Observer 再初期化用）
  const [resetCount, setResetCount] = useState(0);

  // リセット関数
  const reset = useCallback(() => {
    setIsLoading(false);
    isLoadingRef.current = false;
    // リセットカウンターを更新して Observer を再初期化
    setResetCount((prev) => prev + 1);
  }, []);

  // Observer のコールバック
  const handleIntersect = useCallback(async (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;

    if (!entry?.isIntersecting) return;
    if (!hasMoreRef.current) return;
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      await onLoadMoreRef.current();
    } catch (error) {
      console.error('useInfiniteScroll: Failed to load more:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Observer のセットアップと破棄
  useEffect(() => {
    // 無効化されている場合は Observer を作成しない
    if (disabled) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    // 新しい Observer を作成
    const root = scrollContainerRef?.current ?? null;
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root,
      rootMargin,
      threshold,
    });

    // 既にセンチネルが設定されていれば監視を開始
    if (sentinelNodeRef.current) {
      observerRef.current.observe(sentinelNodeRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [disabled, scrollContainerRef, rootMargin, threshold, handleIntersect, resetCount]);

  // センチネル要素の ref コールバック
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    // 前のノードの監視を解除
    if (sentinelNodeRef.current && observerRef.current) {
      observerRef.current.unobserve(sentinelNodeRef.current);
    }

    sentinelNodeRef.current = node;

    // 新しいノードを監視
    if (node && observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  return {
    sentinelRef,
    isLoading,
    reset,
  };
}
