'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMyItems } from '@/actions/workspaceItem';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type {
  MyItemRelationType,
  PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics,
  SummaryWorkspaceResponse,
  WorkspaceItemDetailResponse,
} from '@/connectors/api/pecus';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useNotify } from '@/hooks/useNotify';

interface MyItemsClientProps {
  initialItems?: PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics | null;
  fetchError?: string | null;
}

// フィルタータブの定義
const filterTabs: { key: MyItemRelationType | 'All'; label: string; icon: React.ReactNode }[] = [
  { key: 'All', label: 'すべて', icon: <span className="icon-[mdi--view-list-outline] size-4" aria-hidden="true" /> },
  { key: 'Owner', label: 'オーナー', icon: <span className="icon-[mdi--account-outline] size-4" aria-hidden="true" /> },
  {
    key: 'Assignee',
    label: '担当',
    icon: <span className="icon-[mdi--clipboard-account-outline] size-4" aria-hidden="true" />,
  },
  {
    key: 'Committer',
    label: 'コミッター',
    icon: <span className="icon-[mdi--pencil-outline] size-4" aria-hidden="true" />,
  },
  { key: 'Pinned', label: 'PIN', icon: <span className="icon-[mdi--pin] size-4" aria-hidden="true" /> },
];

export default function MyItemsClient({ initialItems, fetchError }: MyItemsClientProps) {
  const notify = useNotify();

  // アイテム一覧の状態
  const [items, setItems] = useState<WorkspaceItemDetailResponse[]>(initialItems?.data || []);
  const [currentPage, setCurrentPage] = useState(initialItems?.currentPage || 1);
  const [totalPages, setTotalPages] = useState(initialItems?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialItems?.totalCount || 0);

  // ワークスペースサマリー（フィルタリング用）
  const [availableWorkspaces, setAvailableWorkspaces] = useState<SummaryWorkspaceResponse[]>(
    initialItems?.summary?.workspaces || [],
  );

  // フィルター状態
  const [activeFilter, setActiveFilter] = useState<MyItemRelationType | 'All'>('All');
  // アーカイブ表示状態（デフォルト: アーカイブを除外）
  const [showArchived, setShowArchived] = useState(false);
  // 選択されたワークスペースID
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<number[]>([]);
  // ワークスペースドロップダウンの開閉状態
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  // notify の最新値を参照するための ref
  const notifyRef = useRef(notify);

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceDropdownOpen(false);
      }
    };

    if (isWorkspaceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWorkspaceDropdownOpen]);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // 次のページを読み込む（無限スクロール用）
  const loadMoreItems = useCallback(async () => {
    try {
      const nextPage = currentPage + 1;
      const relationParam = activeFilter === 'All' ? undefined : activeFilter;
      const includeArchivedParam = showArchived ? true : undefined;
      const workspaceIdsParam = selectedWorkspaceIds.length > 0 ? selectedWorkspaceIds : undefined;
      const result = await fetchMyItems(nextPage, relationParam, includeArchivedParam, workspaceIdsParam);

      if (result.success) {
        setItems((prev) => [...prev, ...(result.data.data || [])]);
        setCurrentPage(result.data.currentPage || nextPage);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
      } else {
        notifyRef.current.error(result.message || 'アイテムの取得に失敗しました。');
      }
    } catch (err) {
      console.error('Failed to load more items:', err);
      notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
    }
  }, [currentPage, activeFilter, showArchived, selectedWorkspaceIds]);

  // 無限スクロール（Body スクロール）
  const {
    sentinelRef,
    isLoading: isLoadingMore,
    reset: resetInfiniteScroll,
  } = useInfiniteScroll({
    onLoadMore: loadMoreItems,
    hasMore: totalPages > 1 && currentPage < totalPages,
    rootMargin: '200px',
  });

  // フィルター変更ハンドラー（リストをリセットして1ページ目から取得）
  const handleFilterChange = useCallback(
    async (filter: MyItemRelationType | 'All') => {
      setActiveFilter(filter);
      resetInfiniteScroll();
      try {
        const relationParam = filter === 'All' ? undefined : filter;
        const includeArchivedParam = showArchived ? true : undefined;
        const workspaceIdsParam = selectedWorkspaceIds.length > 0 ? selectedWorkspaceIds : undefined;
        const result = await fetchMyItems(1, relationParam, includeArchivedParam, workspaceIdsParam);

        if (result.success) {
          setItems(result.data.data || []);
          setCurrentPage(result.data.currentPage || 1);
          setTotalPages(result.data.totalPages || 1);
          setTotalCount(result.data.totalCount || 0);
          // ワークスペース選択中でなければサマリーを更新
          if (selectedWorkspaceIds.length === 0) {
            setAvailableWorkspaces(result.data.summary?.workspaces || []);
          }
        } else {
          notifyRef.current.error(result.message || 'アイテムの取得に失敗しました。');
        }
      } catch (err) {
        console.error('Failed to fetch my items:', err);
        notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
      }
    },
    [showArchived, selectedWorkspaceIds, resetInfiniteScroll],
  );

  // アーカイブトグルハンドラー
  const handleArchiveToggle = useCallback(async () => {
    const newShowArchived = !showArchived;
    setShowArchived(newShowArchived);
    resetInfiniteScroll();
    try {
      const relationParam = activeFilter === 'All' ? undefined : activeFilter;
      const includeArchivedParam = newShowArchived ? true : undefined;
      const workspaceIdsParam = selectedWorkspaceIds.length > 0 ? selectedWorkspaceIds : undefined;
      const result = await fetchMyItems(1, relationParam, includeArchivedParam, workspaceIdsParam);

      if (result.success) {
        setItems(result.data.data || []);
        setCurrentPage(result.data.currentPage || 1);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
        // ワークスペース選択中でなければサマリーを更新
        if (selectedWorkspaceIds.length === 0) {
          setAvailableWorkspaces(result.data.summary?.workspaces || []);
        }
      } else {
        notifyRef.current.error(result.message || 'アイテムの取得に失敗しました。');
      }
    } catch (err) {
      console.error('Failed to fetch my items:', err);
      notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
    }
  }, [showArchived, activeFilter, selectedWorkspaceIds, resetInfiniteScroll]);

  // ワークスペースフィルターのトグル
  const handleWorkspaceToggle = useCallback(
    async (workspaceId: number) => {
      const newSelectedIds = selectedWorkspaceIds.includes(workspaceId)
        ? selectedWorkspaceIds.filter((id) => id !== workspaceId)
        : [...selectedWorkspaceIds, workspaceId];

      setSelectedWorkspaceIds(newSelectedIds);
      resetInfiniteScroll();

      try {
        const relationParam = activeFilter === 'All' ? undefined : activeFilter;
        const includeArchivedParam = showArchived ? true : undefined;
        const workspaceIdsParam = newSelectedIds.length > 0 ? newSelectedIds : undefined;
        const result = await fetchMyItems(1, relationParam, includeArchivedParam, workspaceIdsParam);

        if (result.success) {
          setItems(result.data.data || []);
          setCurrentPage(result.data.currentPage || 1);
          setTotalPages(result.data.totalPages || 1);
          setTotalCount(result.data.totalCount || 0);
          // ワークスペースを全解除した場合はサマリーを更新
          if (newSelectedIds.length === 0) {
            setAvailableWorkspaces(result.data.summary?.workspaces || []);
          }
        } else {
          notifyRef.current.error(result.message || 'アイテムの取得に失敗しました。');
        }
      } catch (err) {
        console.error('Failed to fetch my items:', err);
        notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
      }
    },
    [selectedWorkspaceIds, activeFilter, showArchived, resetInfiniteScroll],
  );

  // ワークスペースフィルターをクリア
  const handleClearWorkspaceFilter = useCallback(async () => {
    if (selectedWorkspaceIds.length === 0) return;

    setSelectedWorkspaceIds([]);
    resetInfiniteScroll();

    try {
      const relationParam = activeFilter === 'All' ? undefined : activeFilter;
      const includeArchivedParam = showArchived ? true : undefined;
      const result = await fetchMyItems(1, relationParam, includeArchivedParam);

      if (result.success) {
        setItems(result.data.data || []);
        setCurrentPage(result.data.currentPage || 1);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
        setAvailableWorkspaces(result.data.summary?.workspaces || []);
      } else {
        notifyRef.current.error(result.message || 'アイテムの取得に失敗しました。');
      }
    } catch (err) {
      console.error('Failed to fetch my items:', err);
      notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
    }
  }, [selectedWorkspaceIds, activeFilter, showArchived, resetInfiniteScroll]);

  // 初期エラー表示
  useEffect(() => {
    if (fetchError) {
      notify.error(fetchError);
    }
  }, [fetchError, notify]);

  return (
    <>
      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="icon-[mdi--clipboard-text-outline] text-primary w-8 h-8" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold">マイアイテム</h1>
            <p className="text-base-content/70 mt-1">あなたに関連するワークスペースアイテムの一覧</p>
          </div>
        </div>
      </div>

      {/* フィルタータブ */}
      <div className="card mb-6">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 関連タイプフィルター */}
            <div className="flex flex-wrap items-center gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleFilterChange(tab.key)}
                  className={`btn btn-sm gap-1 ${activeFilter === tab.key ? 'btn-primary' : 'btn-outline btn-secondary'}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* アーカイブトグル（別条件として分離） */}
            <div className="flex items-center gap-2">
              {/* ワークスペースフィルター（カスタムドロップダウン） */}
              {availableWorkspaces.length > 0 && (
                <div className="relative" ref={workspaceDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                    className="btn btn-sm btn-outline btn-secondary gap-1"
                    aria-expanded={isWorkspaceDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span className="icon-[mdi--folder-outline] size-4" aria-hidden="true" />
                    <span>ワークスペース</span>
                    {selectedWorkspaceIds.length > 0 && (
                      <span className="badge badge-accent badge-xs">{selectedWorkspaceIds.length}</span>
                    )}
                    <span
                      className={`icon-[mdi--chevron-down] size-4 transition-transform ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* ドロップダウンメニュー */}
                  {isWorkspaceDropdownOpen && (
                    <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-64 sm:w-72 max-h-64 sm:max-h-80 overflow-y-auto rounded-lg bg-base-100 border border-base-content/10 shadow-xl z-50">
                      {/* ヘッダー */}
                      <div className="sticky top-0 bg-base-100 px-3 py-2 border-b border-base-content/10 flex items-center justify-between">
                        <span className="text-sm font-medium">ワークスペースで絞り込み</span>
                        {selectedWorkspaceIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearWorkspaceFilter}
                            className="btn btn-xs btn-ghost text-base-content/50 hover:text-error"
                          >
                            クリア
                          </button>
                        )}
                      </div>
                      {/* ワークスペースリスト */}
                      <div className="py-1" role="listbox" aria-multiselectable="true">
                        {availableWorkspaces.map((workspace) => {
                          const isSelected = selectedWorkspaceIds.includes(workspace.id);
                          return (
                            <button
                              key={workspace.id}
                              type="button"
                              onClick={() => handleWorkspaceToggle(workspace.id)}
                              className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-content/10 transition-colors"
                              role="option"
                              aria-selected={isSelected}
                            >
                              <span
                                className={`flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-accent border-accent text-accent-content' : 'border-base-content/30'}`}
                              >
                                {isSelected && <span className="icon-[mdi--check] size-3" aria-hidden="true" />}
                              </span>
                              {workspace.genreIcon && (
                                <img
                                  src={`/icons/genres/${workspace.genreIcon}.svg`}
                                  alt=""
                                  className="w-4 h-4 flex-shrink-0"
                                />
                              )}
                              <span className="truncate flex-1">{workspace.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleArchiveToggle}
                className={`btn btn-sm gap-1 ${showArchived ? 'btn-warning' : 'btn-default'}`}
                title={showArchived ? 'アーカイブ済みを表示中' : 'アーカイブ済みを表示'}
              >
                <span className="icon-[mdi--archive-outline] size-4" aria-hidden="true" />
                <span>アーカイブ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* アイテム一覧 */}
      <div className="card">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="card-title text-lg">アイテム一覧</h2>
              <span className="badge badge-primary">{totalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              {showArchived && <span className="badge badge-warning badge-outline">アーカイブ済み</span>}
              {activeFilter !== 'All' && (
                <span className="badge badge-secondary badge-outline">
                  {filterTabs.find((t) => t.key === activeFilter)?.label}
                </span>
              )}
              {selectedWorkspaceIds.length > 0 && (
                <span className="badge badge-accent badge-outline">
                  {selectedWorkspaceIds.length}件のワークスペース
                </span>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base-content/70">該当するアイテムがありません</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="card bg-base-200/50 hover:shadow-xl transition-shadow overflow-hidden relative flex flex-col"
                  >
                    <div className="card-body p-4 flex flex-col flex-1">
                      {/* ヘッダー */}
                      <div className="mb-3">
                        {/* ワークスペース名 + ステータス */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="badge badge-soft badge-accent badge-sm truncate p-3 flex items-center gap-1">
                              {item.genreIcon && (
                                <img
                                  src={`/icons/genres/${item.genreIcon}.svg`}
                                  alt={item.genreName || 'ジャンルアイコン'}
                                  title={item.genreName || 'ジャンル'}
                                  className="w-4 h-4 flex-shrink-0"
                                />
                              )}
                              <span className="truncate">{item.workspaceName || 'ワークスペース'}</span>
                              {item.workspaceMode === 'Document' && (
                                <span
                                  className="icon-[mdi--file-document-outline] w-3.5 h-3.5 text-base-content/60 flex-shrink-0"
                                  aria-label="ドキュメントワークスペース"
                                  title="ドキュメントワークスペース"
                                />
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {item.isArchived && <span className="badge badge-neutral badge-xs">アーカイブ</span>}
                            {item.isDraft && <span className="badge badge-warning badge-xs">下書き</span>}
                            {item.isPinned && <span className="icon-[mdi--pin] w-4 h-4 text-info" aria-hidden="true" />}
                          </div>
                        </div>

                        {/* アイテムコード */}
                        <span className="text-xs text-base-content/50 font-mono"># {item.code}</span>
                        {/* 件名 */}
                        <Link href={`/workspaces/${item.workspaceCode}?itemCode=${item.code}`}>
                          <h3 className="text-lg font-bold hover:text-primary transition-colors cursor-pointer wrap-break-word line-clamp-2">
                            {item.subject || '（件名未設定）'}
                          </h3>
                        </Link>
                      </div>

                      {/* メタ情報 */}
                      <div className="space-y-2 mb-3 flex-1">
                        {/* オーナー */}
                        <div className="flex items-center text-sm gap-2">
                          <span className="text-base-content/70 w-20 flex-shrink-0">オーナー</span>
                          <UserAvatar
                            userName={item.ownerUsername}
                            identityIconUrl={item.ownerAvatarUrl}
                            size={20}
                            nameClassName="truncate"
                          />
                        </div>

                        {/* 担当者 */}
                        {item.assigneeUsername && (
                          <div className="flex items-center text-sm gap-2">
                            <span className="text-base-content/70 w-20 flex-shrink-0">担当</span>
                            <UserAvatar
                              userName={item.assigneeUsername}
                              identityIconUrl={item.assigneeAvatarUrl}
                              size={20}
                              nameClassName="truncate"
                            />
                          </div>
                        )}

                        {/* コミッター */}
                        {item.committerUsername && (
                          <div className="flex items-center text-sm gap-2">
                            <span className="text-base-content/70 w-20 flex-shrink-0">コミッター</span>
                            <UserAvatar
                              userName={item.committerUsername}
                              identityIconUrl={item.committerAvatarUrl}
                              size={20}
                              nameClassName="truncate"
                            />
                          </div>
                        )}

                        {/* 更新日 */}
                        <div className="flex items-center text-sm gap-2">
                          <span className="text-base-content/70 w-20 flex-shrink-0">更新日</span>
                          <span>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('ja-JP') : '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* センチネル要素 - IntersectionObserver が監視 */}
              <div ref={sentinelRef} aria-hidden="true" />

              {/* ローディングインジケーター */}
              {isLoadingMore && (
                <div className="text-center py-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              )}

              {/* 終了メッセージ */}
              {!isLoadingMore && currentPage >= totalPages && items.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-base-content/70">すべてのアイテムを表示しました</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
