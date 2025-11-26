'use client';

import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { WorkspaceItemListResponse, WorkspaceListItemResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import WorkspaceSwitcher from './WorkspaceSwitcher';

interface WorkspaceItemsSidebarProps {
  workspaceId: number;
  currentWorkspaceCode: string;
  workspaces: WorkspaceListItemResponse[];
  scrollContainerId?: string;
  onHomeSelect?: () => void;
  onItemSelect?: (itemId: number) => void;
  onCreateNew?: () => void;
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
    },
    ref,
  ) => {
    const [selectedItemId, setSelectedItemId] = useState<'home' | 'new' | number | null>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<WorkspaceItemListResponse[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const notify = useNotify();

    // currentPageの最新値を参照するためのref
    const currentPageRef = useRef(currentPage);
    useEffect(() => {
      currentPageRef.current = currentPage;
    }, [currentPage]);

    // アイテムをリロードするメソッド
    const refreshItems = useCallback(
      async (selectItemId?: number) => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/workspaces/${workspaceId}/items?page=1`);

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
          notify.error('サーバーとの通信でエラーが発生しました。', true);
        } finally {
          setIsLoading(false);
        }
      },
      [workspaceId, notify],
    );

    // 初期ロード
    useEffect(() => {
      refreshItems();
    }, [refreshItems]);

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

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/items?page=${nextPage}`);

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        const newItems = data.data || [];

        // 重複を除外してアイテムを追加
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNewItems = newItems.filter((item: WorkspaceItemListResponse) => !existingIds.has(item.id));
          return [...prev, ...uniqueNewItems];
        });

        setCurrentPage(nextPage);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Failed to load more items:', err);
        notify.error('サーバーとの通信でエラーが発生しました。', true);
      }
    }, [workspaceId, notify]);

    // 検索フィルター
    const filteredItems = useMemo(() => {
      if (!searchQuery.trim()) {
        return items;
      }
      return items.filter((item) => item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    }, [items, searchQuery]);

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
            {searchQuery ? `${filteredItems.length} 件（全 ${totalCount} 件中）` : `${totalCount} 件`}
          </p>

          {/* 検索ボックス */}
          <div className="relative">
            <input
              type="text"
              placeholder="検索..."
              className="input input-bordered input-sm w-full pl-9 pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-base-content/50 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-base-content/50 hover:text-base-content transition-colors"
                title="クリア"
              >
                <ClearIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* アイテムリスト */}
        {isLoading && items.length === 0 ? (
          <div className="flex justify-center items-center flex-1">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-center text-base-content/70">
            <p className="text-sm">{searchQuery ? '該当するアイテムがありません' : 'アイテムがありません'}</p>
          </div>
        ) : (
          <div id={scrollContainerId} className="overflow-y-auto bg-base-200 flex-1" style={{ maxHeight: '750px' }}>
            <InfiniteScroll
              dataLength={filteredItems.length}
              next={loadMoreItems}
              hasMore={!searchQuery && currentPage < totalPages}
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
                {filteredItems.map((item) => (
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
      </aside>
    );
  },
);

WorkspaceItemsSidebar.displayName = 'WorkspaceItemsSidebar';

export default WorkspaceItemsSidebar;
