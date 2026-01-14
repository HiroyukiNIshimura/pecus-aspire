'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import DebouncedSearchInput from '@/components/common/filters/DebouncedSearchInput';
import DocumentTreeSidebar from '@/components/workspaceItems/DocumentTreeSidebar';
import WorkspaceItemFilterDrawer, {
  type WorkspaceItemFilters,
} from '@/components/workspaceItems/WorkspaceItemFilterDrawer';
import WorkspaceSwitcher from '@/components/workspaceItems/WorkspaceSwitcher';
import type { TaskPriority, WorkspaceItemDetailResponse, WorkspaceMode } from '@/connectors/api/pecus';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useNotify } from '@/hooks/useNotify';

/** 優先度に応じた左ボーダー色のクラスを取得 */
function getPriorityBorderClass(priority?: TaskPriority | null): string {
  switch (priority) {
    case 'Critical':
      return 'border-l-4 border-l-error/60';
    case 'High':
      return 'border-l-4 border-l-warning/60';
    case 'Medium':
      return 'border-l-4 border-l-info/60';
    case 'Low':
      return 'border-l-4 border-l-base-content/40';
    default:
      return 'border-l-4 border-l-base-content/10';
  }
}

/** 日付を短縮形式（MM/DD）でフォーマット */
function formatShortDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

/** 期限日が過ぎているかどうかを判定 */
function isDueDatePast(dateString?: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

interface WorkspaceItemsSidebarProps {
  workspaceId: number;
  currentWorkspaceCode: string;
  /** 現在のワークスペース情報（WorkspaceSwitcher 表示用） */
  currentWorkspace?: {
    name: string;
    code: string;
    genreIcon?: string | null;
    genreName?: string | null;
    mode?: WorkspaceMode;
  };
  onHomeSelect?: () => void;
  onItemSelect?: (itemId: number, itemCode: string) => void;
  onCreateNew?: () => void;
  /** URLクエリパラメータで指定された初期選択アイテムID */
  initialSelectedItemId?: number;
  /** 現在ログイン中のユーザー情報（フィルターの「自分」選択用） */
  currentUser?: {
    id: number;
    username: string;
    email: string;
    identityIconUrl: string | null;
  } | null;
  /** 選択モードで関連付けが確定された時のコールバック */
  onSelectionConfirm?: (selectedItemIds: number[]) => void;
  /** 選択モードがキャンセルされた時のコールバック */
  onSelectionCancel?: () => void;
  /** 編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
}

export interface WorkspaceItemsSidebarHandle {
  refreshItems: (selectItemId?: number) => Promise<void>;
  /** 選択モードを開始（関連アイテム追加用） */
  startSelectionMode: (currentItemId: number, excludeItemIds: number[]) => void;
  /** 選択モードを終了 */
  endSelectionMode: () => void;
}

const WorkspaceItemsSidebar = forwardRef<WorkspaceItemsSidebarHandle, WorkspaceItemsSidebarProps>(
  (
    {
      workspaceId,
      currentWorkspaceCode,
      currentWorkspace,
      onHomeSelect,
      onItemSelect,
      onCreateNew,
      initialSelectedItemId,
      currentUser,
      onSelectionConfirm,
      onSelectionCancel,
      canEdit = true,
    },
    ref,
  ) => {
    // initialSelectedItemId が指定されている場合は、そのアイテムを初期選択状態に
    const [selectedItemId, setSelectedItemId] = useState<'home' | 'new' | number | null>(
      initialSelectedItemId ?? 'home',
    );
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

    // 選択モードの状態
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectionModeCurrentItemId, setSelectionModeCurrentItemId] = useState<number | null>(null);
    const [excludeItemIds, setExcludeItemIds] = useState<number[]>([]);
    const [selectedForRelation, setSelectedForRelation] = useState<Set<number>>(new Set());

    // 表示モード（リスト/ツリー）- ワークスペースモードに応じて初期値を設定
    const [viewMode, setViewMode] = useState<'list' | 'tree'>(currentWorkspace?.mode === 'Document' ? 'tree' : 'list');

    // ツリー再取得用のキー
    const [treeRefreshKey, setTreeRefreshKey] = useState(0);

    // ワークスペースモードが変更されたらビューモードをリセット
    useEffect(() => {
      if (currentWorkspace?.mode === 'Document') {
        setViewMode('tree');
      } else {
        setViewMode('list');
      }
    }, [currentWorkspace?.mode]);

    // スクロールコンテナの ref
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      if (appliedFilters.hasDueDate !== null && appliedFilters.hasDueDate !== undefined) {
        params.set('hasDueDate', String(appliedFilters.hasDueDate));
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

          // ツリービューも更新
          setTreeRefreshKey((prev) => prev + 1);
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
    }, [workspaceId]); // workspaceId変更時にリロード

    // 選択モードを開始
    const startSelectionMode = useCallback((currentItemId: number, excludeIds: number[]) => {
      setIsSelectionMode(true);
      setSelectionModeCurrentItemId(currentItemId);
      setExcludeItemIds(excludeIds);
      setSelectedForRelation(new Set());
    }, []);

    // 選択モードを終了
    const endSelectionMode = useCallback(() => {
      setIsSelectionMode(false);
      setSelectionModeCurrentItemId(null);
      setExcludeItemIds([]);
      setSelectedForRelation(new Set());
    }, []);

    // 選択を確定
    const handleConfirmSelection = useCallback(() => {
      if (selectedForRelation.size > 0) {
        onSelectionConfirm?.(Array.from(selectedForRelation));
      }
      endSelectionMode();
    }, [selectedForRelation, onSelectionConfirm, endSelectionMode]);

    // 選択をキャンセル
    const handleCancelSelection = useCallback(() => {
      onSelectionCancel?.();
      endSelectionMode();
    }, [onSelectionCancel, endSelectionMode]);

    // アイテムの選択/解除をトグル
    const toggleItemSelection = useCallback((itemId: number) => {
      setSelectedForRelation((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    }, []);

    // imperative handle で refreshItems と選択モード制御を公開
    useImperativeHandle(
      ref,
      () => ({
        refreshItems,
        startSelectionMode,
        endSelectionMode,
      }),
      [refreshItems, startSelectionMode, endSelectionMode],
    );

    const loadMoreItems = useCallback(async () => {
      const nextPage = currentPageRef.current + 1;
      const currentSearchQuery = searchQueryRef.current;
      const currentFilters = filtersRef.current;

      try {
        let baseUrl = `/api/workspaces/${workspaceId}/items?page=${nextPage}`;
        // ドキュメントモードかつツリー表示の場合は全件取得（上限1000件）
        if (currentWorkspace?.mode === 'Document' && viewMode === 'tree') {
          baseUrl += '&pageSize=1000';
        }

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
    }, [workspaceId, buildFilterParams, currentWorkspace?.mode, viewMode]);

    // 無限スクロール
    const {
      sentinelRef,
      isLoading: isLoadingMore,
      reset: resetInfiniteScroll,
    } = useInfiniteScroll({
      onLoadMore: loadMoreItems,
      hasMore: currentPage < totalPages,
      rootMargin: '100px',
      scrollContainerRef,
    });

    // 検索クエリ変更時のハンドラー
    const handleSearch = useCallback(
      async (query: string) => {
        setSearchQuery(query);
        // refも即座に更新（loadMoreItemsがuseEffect実行前に呼ばれた場合に備えて）
        searchQueryRef.current = query;
        // refreshItems完了後にresetを呼ぶ（hasMoreが更新されてからObserverを再初期化するため）
        await refreshItemsRef.current(undefined, query);
        resetInfiniteScroll();
      },
      [resetInfiniteScroll],
    );

    // フィルタードローワーを閉じるハンドラー
    const handleCloseFilterDrawer = useCallback(() => {
      setIsFilterDrawerClosing(true);
      setTimeout(() => {
        setIsFilterDrawerOpen(false);
        setIsFilterDrawerClosing(false);
      }, 250);
    }, []);

    // フィルター適用ハンドラー
    const handleApplyFilters = useCallback(
      async (newFilters: WorkspaceItemFilters) => {
        setFilters(newFilters);
        filtersRef.current = newFilters;
        // フィルターを適用してアイテムを再取得する
        await refreshItemsRef.current(undefined, undefined, newFilters);
        resetInfiniteScroll();
      },
      [resetInfiniteScroll],
    );

    return (
      <aside className="w-full bg-base-200 border-r border-base-300 flex flex-col h-full">
        {/* ヘッダー */}
        <div className="bg-base-200 border-b border-base-300 p-4 flex-shrink-0">
          {/* 選択モード時のヘッダー */}
          {isSelectionMode ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="icon-[mdi--link] w-5 h-5 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-bold">関連アイテムを選択</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="btn btn-secondary btn-sm btn-circle"
                  title="キャンセル"
                >
                  <span className="icon-[mdi--close] w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-base-content/70 mb-3">
                関連付けるアイテムをチェックしてください（{selectedForRelation.size} 件選択中）
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={selectedForRelation.size === 0}
                  className="btn btn-primary btn-sm flex-1"
                >
                  関連付け（{selectedForRelation.size}）
                </button>
                <button type="button" onClick={handleCancelSelection} className="btn btn-outline btn-sm flex-1">
                  キャンセル
                </button>
              </div>
              {/* 検索ボックス（選択モード時） */}
              <DebouncedSearchInput onSearch={handleSearch} placeholder="あいまい検索..." debounceMs={300} size="sm" />
            </>
          ) : (
            <>
              {/* ワークスペース切り替え */}
              <div className="mb-4">
                <WorkspaceSwitcher currentWorkspaceCode={currentWorkspaceCode} currentWorkspace={currentWorkspace} />
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
                      : 'hover:bg-base-200 text-base-content'
                  }`}
                  title="ワークスペースHome"
                >
                  <span className="icon-[mdi--home-outline] w-4 h-4" aria-hidden="true" />
                  <span>ワークスペースHome</span>
                </button>
              </div>

              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold">アイテム一覧</h3>
                <span className="text-xs text-base-content/70">
                  {searchQuery ? `${items.length} 件（検索結果）` : `${totalCount} 件`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button type="button" onClick={() => refreshItems()} className="btn btn-text btn-xs" title="一覧を更新">
                  <span className="icon-[mdi--refresh] w-4 h-4" aria-hidden="true" />
                </button>
                {currentWorkspace?.mode === 'Document' && (
                  <div className="join">
                    <button
                      type="button"
                      className={`btn btn-xs join-item ${viewMode === 'list' ? 'btn-active btn-primary' : 'btn-secondary'}`}
                      onClick={() => setViewMode('list')}
                      title="リスト表示"
                    >
                      <span className="icon-[mdi--format-list-bulleted] w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs join-item ${viewMode === 'tree' ? 'btn-active btn-primary' : 'btn-secondary'}`}
                      onClick={() => setViewMode('tree')}
                      title="ツリー表示"
                    >
                      <span className="icon-[mdi--file-tree-outline] w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!canEdit) {
                      notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
                      return;
                    }
                    setSelectedItemId('new');
                    onCreateNew?.();
                  }}
                  className="btn btn-primary btn-sm gap-1 ml-auto"
                  title="アイテムを追加"
                >
                  <span className="icon-[mdi--plus-circle-outline] w-4 h-4" aria-hidden="true" />
                  <span>追加</span>
                </button>
              </div>

              {/* 検索ボックス */}
              {(currentWorkspace?.mode !== 'Document' || viewMode === 'list') && (
                <DebouncedSearchInput
                  onSearch={handleSearch}
                  placeholder="あいまい検索..."
                  debounceMs={300}
                  size="sm"
                />
              )}

              {/* 詳細フィルターリンク */}
              {(currentWorkspace?.mode !== 'Document' || viewMode === 'list') && (
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-primary hover:underline"
                >
                  <span className="icon-[mdi--filter-outline] w-3 h-3" aria-hidden="true" />
                  <span>詳細フィルター</span>
                  {Object.values(filters).filter((v) => v !== null && v !== undefined && v !== '').length > 0 && (
                    <span className="badge badge-primary badge-xs">
                      {Object.values(filters).filter((v) => v !== null && v !== undefined && v !== '').length}
                    </span>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* アイテムリスト */}
        {isLoading && items.length === 0 ? (
          <div className="flex justify-center items-center flex-1">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        ) : viewMode === 'tree' && currentWorkspace?.mode === 'Document' ? (
          <DocumentTreeSidebar
            workspaceId={workspaceId}
            onItemSelect={(itemId, itemCode) => {
              setSelectedItemId(itemId);
              onItemSelect?.(itemId, itemCode);
            }}
            selectedItemId={typeof selectedItemId === 'number' ? selectedItemId : null}
            onItemMoved={() => refreshItems()}
            refreshKey={treeRefreshKey}
            canEdit={canEdit}
          />
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-base-content/70">
            <p className="text-sm">{searchQuery ? '該当するアイテムがありません' : 'アイテムがありません'}</p>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="overflow-y-auto bg-base-200 flex-1" style={{ maxHeight: '750px' }}>
            <ul className="space-y-1 p-2">
              {items.map((item) => {
                const shortDate = formatShortDate(item.dueDate);
                const isPast = isDueDatePast(item.dueDate);
                const itemId = item.id;

                // 選択モード時: 自分自身や既存関連は除外
                const isExcluded =
                  isSelectionMode &&
                  itemId !== undefined &&
                  (itemId === selectionModeCurrentItemId || excludeItemIds.includes(itemId));
                const isSelected = itemId !== undefined && selectedForRelation.has(itemId);

                // 選択モード時のクリックハンドラー
                const handleItemClick = () => {
                  if (!itemId) return;

                  if (isSelectionMode) {
                    if (!isExcluded) {
                      toggleItemSelection(itemId);
                    }
                  } else {
                    setSelectedItemId(itemId);
                    onItemSelect?.(itemId, item.code ?? '');
                  }
                };

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={handleItemClick}
                      disabled={isExcluded}
                      className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${getPriorityBorderClass(
                        item.priority,
                      )} ${
                        isSelectionMode
                          ? isExcluded
                            ? 'opacity-40 cursor-not-allowed bg-base-300'
                            : isSelected
                              ? 'bg-primary/20 ring-2 ring-primary'
                              : 'hover:bg-base-100 text-base-content'
                          : selectedItemId === item.id
                            ? 'bg-primary text-primary-content font-semibold'
                            : 'hover:bg-base-100 text-base-content'
                      }`}
                      title={isExcluded ? '選択できません' : item.subject || '（未設定）'}
                    >
                      <div className="flex items-start gap-2">
                        {/* 選択モード時: チェックボックス */}
                        {isSelectionMode && (
                          <div className="flex-shrink-0 mt-0.5">
                            {isExcluded ? (
                              <span
                                className="icon-[mdi--checkbox-blank-outline] w-4 h-4 opacity-30"
                                aria-hidden="true"
                              />
                            ) : isSelected ? (
                              <span
                                className="icon-[mdi--checkbox-marked-outline] w-4 h-4 text-primary"
                                aria-hidden="true"
                              />
                            ) : (
                              <span className="icon-[mdi--checkbox-blank-outline] w-4 h-4" aria-hidden="true" />
                            )}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* 1行目: コード */}
                          <span className="text-xs text-base-content/50 font-mono">#{item.code}</span>
                          {/* 2行目: 件名 */}
                          <div className="truncate">{item.subject || '（未設定）'}</div>

                          {/* 3行目: ステータスアイコン群（常に表示） */}
                          <div className="flex items-center gap-2 mt-1.5 text-xs opacity-70 h-4">
                            {/* 下書き */}
                            {item.isDraft && (
                              <span className="flex items-center gap-0.5" title="下書き">
                                <span className="icon-[mdi--file-document-edit-outline] w-3 h-3" aria-hidden="true" />
                                <span>下書き</span>
                              </span>
                            )}

                            {/* 期限日 */}
                            {shortDate && (
                              <span
                                className={`flex items-center gap-0.5 ${isPast ? 'text-error font-semibold' : ''}`}
                                title={`期限: ${item.dueDate}`}
                              >
                                <span className="icon-[mdi--calendar-outline] w-3 h-3" aria-hidden="true" />
                                <span>{shortDate}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* センチネル要素 - IntersectionObserver が監視 */}
            <div ref={sentinelRef} aria-hidden="true" />

            {/* ローディングインジケーター */}
            {isLoadingMore && (
              <div className="text-center py-4">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            )}

            {/* 終了メッセージ */}
            {!isLoadingMore && currentPage >= totalPages && items.length > 0 && (
              <div className="text-center py-2 text-xs text-base-content/70">
                <p>すべて表示</p>
              </div>
            )}
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
