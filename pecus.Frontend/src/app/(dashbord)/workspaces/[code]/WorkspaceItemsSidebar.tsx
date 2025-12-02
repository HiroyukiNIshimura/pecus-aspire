'use client';

import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import HomeIcon from '@mui/icons-material/Home';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import type { WorkspaceItemDetailResponse, WorkspaceListItemResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import WorkspaceItemFilterDrawer, { type WorkspaceItemFilters } from './WorkspaceItemFilterDrawer';
import WorkspaceSwitcher from './WorkspaceSwitcher';

interface WorkspaceItemsSidebarProps {
  workspaceId: number;
  currentWorkspaceCode: string;
  workspaces: WorkspaceListItemResponse[];
  scrollContainerId?: string;
  onHomeSelect?: () => void;
  onItemSelect?: (itemId: number) => void;
  onCreateNew?: () => void;
  /** 現在ログイン中のユーザー情報（フィルターの「自分」選択用） */
  currentUser?: {
    id: number;
    username: string;
    email: string;
    identityIconUrl: string | null;
  } | null;
}

export interface WorkspaceItemsSidebarHandle {
  refreshItems: (selectItemId?: number) => Promise<void>;
}

const WorkspaceItemsSidebar = forwardRef<WorkspaceItemsSidebarHandle, WorkspaceItemsSidebarProps>(
  (
    {
      workspaceId,
      currentWorkspaceCode,
      workspaces,
      scrollContainerId = 'itemsScrollableDiv',
      onHomeSelect,
      onItemSelect,
      onCreateNew,
      currentUser,
    },
    ref,
  ) => {
    const [selectedItemId, setSelectedItemId] = useState<'home' | 'new' | number | null>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<WorkspaceItemDetailResponse[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // フィルタードローワーの状態
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isFilterDrawerClosing, setIsFilterDrawerClosing] = useState(false);
    const [filters, setFilters] = useState<WorkspaceItemFilters>({});

    const notify = useNotify();
    const notifyRef = useRef(notify);
    useEffect(() => {
      notifyRef.current = notify;
    }, [notify]);

    // currentPageの最新値を参照するためのref
    const currentPageRef = useRef(currentPage);
    useEffect(() => {
      currentPageRef.current = currentPage;
    }, [currentPage]);

    // 検索クエリの最新値を参照するためのref
    const searchQueryRef = useRef(searchQuery);
    useEffect(() => {
      searchQueryRef.current = searchQuery;
    }, [searchQuery]);

    // フィルターの最新値を参照するためのref
    const filtersRef = useRef(filters);
    useEffect(() => {
      filtersRef.current = filters;
    }, [filters]);

    // URLにフィルターパラメータを追加するヘルパー関数
    const buildFilterParams = useCallback((baseUrl: string, appliedFilters: WorkspaceItemFilters, query?: string) => {
      const params = new URLSearchParams();
      const urlParts = baseUrl.split('?');
      const baseUrlWithoutParams = urlParts[0];
      if (urlParts[1]) {
        // 既存のパラメータを追加
        const existingParams = new URLSearchParams(urlParts[1]);
        existingParams.forEach((value, key) => {
          params.set(key, value);
        });
      }

      if (query) {
        params.set('searchQuery', query);
      }
      if (appliedFilters.assigneeId !== null && appliedFilters.assigneeId !== undefined) {
        params.set('assigneeId', String(appliedFilters.assigneeId));
      }
      if (appliedFilters.ownerId !== null && appliedFilters.ownerId !== undefined) {
        params.set('ownerId', String(appliedFilters.ownerId));
      }
      if (appliedFilters.committerId !== null && appliedFilters.committerId !== undefined) {
        params.set('committerId', String(appliedFilters.committerId));
      }
      if (appliedFilters.priority !== null && appliedFilters.priority !== undefined) {
        params.set('priority', appliedFilters.priority);
      }
      if (appliedFilters.isDraft !== null && appliedFilters.isDraft !== undefined) {
        params.set('isDraft', String(appliedFilters.isDraft));
      }
      if (appliedFilters.isArchived !== null && appliedFilters.isArchived !== undefined) {
        params.set('isArchived', String(appliedFilters.isArchived));
      }
      if (appliedFilters.pinned !== null && appliedFilters.pinned !== undefined) {
        params.set('pinned', String(appliedFilters.pinned));
      }

      const queryString = params.toString();
      return queryString ? `${baseUrlWithoutParams}?${queryString}` : baseUrlWithoutParams;
    }, []);

    // アイテムをリロードするメソッド
    const refreshItems = useCallback(
      async (selectItemId?: number, query?: string, appliedFilters?: WorkspaceItemFilters) => {
        try {
          setIsLoading(true);
          const searchParam = query !== undefined ? query : searchQueryRef.current;
          const currentFilters = appliedFilters !== undefined ? appliedFilters : filtersRef.current;
          const baseUrl = `/api/workspaces/${workspaceId}/items?page=1`;
          const url = buildFilterParams(baseUrl, currentFilters, searchParam || undefined);
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error('Failed to fetch items');
          }

          const data = await response.json();
          const initialItems = data.data || [];
          setItems(initialItems);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);

          // 新規作成されたアイテムを選択状態に設定
          if (selectItemId !== undefined) {
            setSelectedItemId(selectItemId);
          }
        } catch (err) {
          console.error('Failed to fetch items:', err);
          notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
        } finally {
          setIsLoading(false);
        }
      },
      [workspaceId, buildFilterParams],
    );

    // refreshItemsの最新値を参照するためのref（初期値を設定）
    const refreshItemsRef = useRef<typeof refreshItems>(refreshItems);
    refreshItemsRef.current = refreshItems;

    // 初期ロード
    useEffect(() => {
      refreshItems();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId]);

    // imperative handle で refreshItems を公開
    useImperativeHandle(
      ref,
      () => ({
        refreshItems,
      }),
      [refreshItems],
    );

    const loadMoreItems = useCallback(async () => {
      const nextPage = currentPageRef.current + 1;
      const currentSearchQuery = searchQueryRef.current;
      const currentFilters = filtersRef.current;

      try {
        const baseUrl = `/api/workspaces/${workspaceId}/items?page=${nextPage}`;
        const url = buildFilterParams(baseUrl, currentFilters, currentSearchQuery || undefined);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        const newItems = data.data || [];

        // 重複を除外してアイテムを追加
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNewItems = newItems.filter((item: WorkspaceItemDetailResponse) => !existingIds.has(item.id));
          return [...prev, ...uniqueNewItems];
        });

        setCurrentPage(nextPage);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Failed to load more items:', err);
        notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
      }
    }, [workspaceId, buildFilterParams]);

    // 検索クエリ変更時のハンドラー
    const handleSearch = useCallback((query: string) => {
      setSearchQuery(query);
      refreshItemsRef.current(undefined, query);
    }, []);

    // フィルタードローワーを閉じるハンドラー
    const handleCloseFilterDrawer = useCallback(() => {
      setIsFilterDrawerClosing(true);
      setTimeout(() => {
        setIsFilterDrawerOpen(false);
        setIsFilterDrawerClosing(false);
      }, 250);
    }, []);

    // フィルター適用ハンドラー
    const handleApplyFilters = useCallback((newFilters: WorkspaceItemFilters) => {
      setFilters(newFilters);
      // フィルターを適用してアイテムを再取得する
      refreshItemsRef.current(undefined, undefined, newFilters);
    }, []);

    return (
      <aside className="w-full bg-base-200 border-r border-base-300 flex flex-col h-full">
        {/* ヘッダー */}
        <div className="bg-base-200 border-b border-base-300 p-4 flex-shrink-0">
          {/* ワークスペース切り替え */}
          <div className="mb-4">
            <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceCode={currentWorkspaceCode} />
          </div>

          {/* ワークスペースHomeボタン */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setSelectedItemId('home');
                onHomeSelect?.();
              }}
              className={`w-full text-left px-3 py-2 rounded transition-colors text-sm flex items-center gap-2 ${
                selectedItemId === 'home'
                  ? 'bg-primary text-primary-content font-semibold'
                  : 'hover:bg-base-300 text-base-content'
              }`}
              title="ワークスペースHome"
            >
              <HomeIcon className="w-4 h-4" />
              <span>ワークスペースHome</span>
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">アイテム一覧</h3>
            <button
              type="button"
              onClick={() => {
                setSelectedItemId('new');
                onCreateNew?.();
              }}
              className="btn btn-primary btn-sm gap-1"
              title="アイテムを追加"
            >
              <AddIcon className="w-4 h-4" />
              <span>追加</span>
            </button>
          </div>
          <p className="text-xs text-base-content/70 mb-3">
            {searchQuery ? `${items.length} 件（検索結果）` : `${totalCount} 件`}
          </p>

          {/* 検索ボックス */}
          <DebouncedSearchInput onSearch={handleSearch} placeholder="あいまい検索..." debounceMs={300} size="sm" />

          {/* 詳細フィルターリンク */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-primary hover:underline"
          >
            <FilterListIcon className="w-3 h-3" />
            <span>詳細フィルター</span>
            {Object.values(filters).filter((v) => v !== null && v !== undefined && v !== '').length > 0 && (
              <span className="badge badge-primary badge-xs">
                {Object.values(filters).filter((v) => v !== null && v !== undefined && v !== '').length}
              </span>
            )}
          </button>
        </div>

        {/* アイテムリスト */}
        {isLoading && items.length === 0 ? (
          <div className="flex justify-center items-center flex-1">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-base-content/70">
            <p className="text-sm">{searchQuery ? '該当するアイテムがありません' : 'アイテムがありません'}</p>
          </div>
        ) : (
          <div id={scrollContainerId} className="overflow-y-auto bg-base-200 flex-1" style={{ maxHeight: '750px' }}>
            <InfiniteScroll
              dataLength={items.length}
              next={loadMoreItems}
              hasMore={currentPage < totalPages}
              loader={
                <div className="text-center py-4">
                  <span className="loading loading-spinner loading-sm"></span>
                </div>
              }
              endMessage={
                <div className="text-center py-2 text-xs text-base-content/70">
                  <p>すべて表示</p>
                </div>
              }
              scrollableTarget={scrollContainerId}
            >
              <ul className="space-y-1 p-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.id) {
                          setSelectedItemId(item.id);
                          onItemSelect?.(item.id);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition-colors text-sm truncate ${
                        selectedItemId === item.id
                          ? 'bg-primary text-primary-content font-semibold'
                          : 'hover:bg-base-300 text-base-content'
                      }`}
                      title={item.subject || '（未設定）'}
                    >
                      {item.subject || '（未設定）'}
                    </button>
                  </li>
                ))}
              </ul>
            </InfiniteScroll>
          </div>
        )}

        {/* フィルタードローワー */}
        <WorkspaceItemFilterDrawer
          isOpen={isFilterDrawerOpen}
          isClosing={isFilterDrawerClosing}
          onClose={handleCloseFilterDrawer}
          currentFilters={filters}
          onApplyFilters={handleApplyFilters}
          currentUser={currentUser}
        />
      </aside>
    );
  },
);

WorkspaceItemsSidebar.displayName = 'WorkspaceItemsSidebar';

export default WorkspaceItemsSidebar;
