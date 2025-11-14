"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import type { WorkspaceItemListResponse } from "@/connectors/api/pecus";

interface WorkspaceItemsSidebarProps {
  workspaceId: number;
  scrollContainerId?: string;
}

export default function WorkspaceItemsSidebar({
  workspaceId,
  scrollContainerId = "itemsScrollableDiv",
}: WorkspaceItemsSidebarProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<WorkspaceItemListResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期ロード
  useEffect(() => {
    const fetchInitialItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/workspaces/${workspaceId}/items?page=1`);

        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }

        const data = await response.json();
        const initialItems = data.data || [];
        setItems(initialItems);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);

        if (initialItems.length > 0 && initialItems[0].id) {
          setSelectedItemId(initialItems[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialItems();
  }, [workspaceId]);

  const loadMoreItems = useCallback(async () => {
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(
        `/api/workspaces/${workspaceId}/items?page=${nextPage}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }

      const data = await response.json();
      const newItems = data.data || [];

      // 重複を除外してアイテムを追加
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNewItems = newItems.filter(
          (item: WorkspaceItemListResponse) => !existingIds.has(item.id)
        );
        return [...prev, ...uniqueNewItems];
      });

      setCurrentPage(data.currentPage || nextPage);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more items");
    }
  }, [workspaceId, currentPage]);

  // 検索フィルター
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    return items.filter(
      (item) =>
        item.subject
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ?? false
    );
  }, [items, searchQuery]);

  return (
    <aside className="w-full bg-base-200 border-r border-base-300 flex flex-col h-full">
      {/* ヘッダー */}
      <div className="bg-base-200 border-b border-base-300 p-4 flex-shrink-0">
        <h3 className="text-lg font-bold mb-2">アイテム一覧</h3>
        <p className="text-xs text-base-content/70 mb-3">
          {searchQuery
            ? `${filteredItems.length} 件（全 ${totalCount} 件中）`
            : `${totalCount} 件`}
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
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-base-content/50 hover:text-base-content transition-colors"
              title="クリア"
            >
              <ClearIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* アイテムリスト */}
      {error ? (
        <div className="p-4 text-center text-error text-sm">
          <p>{error}</p>
        </div>
      ) : isLoading && items.length === 0 ? (
        <div className="flex justify-center items-center flex-1">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-4 text-center text-base-content/70">
          <p className="text-sm">
            {searchQuery ? "該当するアイテムがありません" : "アイテムがありません"}
          </p>
        </div>
      ) : (
        <div id={scrollContainerId} className="flex-1 overflow-y-auto bg-base-200">
          <InfiniteScroll
            dataLength={filteredItems.length}
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
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => item.id && setSelectedItemId(item.id)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors text-sm truncate ${
                      selectedItemId === item.id
                        ? "bg-primary text-primary-content font-semibold"
                        : "hover:bg-base-300 text-base-content"
                    }`}
                    title={item.subject || "（未設定）"}
                  >
                    {item.subject || "（未設定）"}
                  </button>
                </li>
              ))}
            </ul>
          </InfiniteScroll>
        </div>
      )}
    </aside>
  );
}
