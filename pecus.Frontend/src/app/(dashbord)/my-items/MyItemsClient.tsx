'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { fetchMyItems } from '@/actions/workspaceItem';
import AppHeader from '@/components/common/AppHeader';
import DashboardSidebar from '@/components/common/DashboardSidebar';
import type {
  MyItemRelationType,
  WorkspaceItemDetailResponse,
  WorkspaceItemDetailResponsePagedResponse,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';
import { getDisplayIconUrl } from '@/utils/imageUrl';

interface MyItemsClientProps {
  initialUser?: UserInfo | null;
  initialItems?: WorkspaceItemDetailResponsePagedResponse | null;
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

export default function MyItemsClient({ initialUser, initialItems, fetchError }: MyItemsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);
  const notify = useNotify();

  // アイテム一覧の状態
  const [items, setItems] = useState<WorkspaceItemDetailResponse[]>(initialItems?.data || []);
  const [currentPage, setCurrentPage] = useState(initialItems?.currentPage || 1);
  const [totalPages, setTotalPages] = useState(initialItems?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialItems?.totalCount || 0);

  // フィルター状態
  const [activeFilter, setActiveFilter] = useState<MyItemRelationType | 'All'>('All');
  // アーカイブ表示状態（デフォルト: アーカイブを除外）
  const [showArchived, setShowArchived] = useState(false);

  // notify の最新値を参照するための ref
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // 次のページを読み込む（無限スクロール用）
  const loadMoreItems = useCallback(async () => {
    try {
      const nextPage = currentPage + 1;
      const relationParam = activeFilter === 'All' ? undefined : activeFilter;
      const includeArchivedParam = showArchived ? true : undefined;
      const result = await fetchMyItems(nextPage, relationParam, includeArchivedParam);

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
  }, [currentPage, activeFilter, showArchived]);

  // フィルター変更ハンドラー（リストをリセットして1ページ目から取得）
  const handleFilterChange = useCallback(
    async (filter: MyItemRelationType | 'All') => {
      setActiveFilter(filter);
      try {
        const relationParam = filter === 'All' ? undefined : filter;
        const includeArchivedParam = showArchived ? true : undefined;
        const result = await fetchMyItems(1, relationParam, includeArchivedParam);

        if (result.success) {
          setItems(result.data.data || []);
          setCurrentPage(result.data.currentPage || 1);
          setTotalPages(result.data.totalPages || 1);
          setTotalCount(result.data.totalCount || 0);
        } else {
          notifyRef.current.error(result.message || 'アイテムの取得に失敗しました。');
        }
      } catch (err) {
        console.error('Failed to fetch my items:', err);
        notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
      }
    },
    [showArchived],
  );

  // アーカイブトグルハンドラー
  const handleArchiveToggle = useCallback(async () => {
    const newShowArchived = !showArchived;
    setShowArchived(newShowArchived);
    try {
      const relationParam = activeFilter === 'All' ? undefined : activeFilter;
      const includeArchivedParam = newShowArchived ? true : undefined;
      const result = await fetchMyItems(1, relationParam, includeArchivedParam);

      if (result.success) {
        setItems(result.data.data || []);
        setCurrentPage(result.data.currentPage || 1);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
      } else {
        notifyRef.current.error(result.message || 'アイテムの取得に失敗しました。');
      }
    } catch (err) {
      console.error('Failed to fetch my items:', err);
      notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
    }
  }, [showArchived, activeFilter]);

  // 初期エラー表示
  useEffect(() => {
    if (fetchError) {
      notify.error(fetchError);
    }
  }, [fetchError, notify]);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader userInfo={userInfo} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <DashboardSidebar sidebarOpen={sidebarOpen} isAdmin={userInfo?.isAdmin ?? false} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="サイドバーを閉じる"
          />
        )}

        {/* Main Content */}
        <main id="scrollableDiv" className="flex-1 p-4 md:p-6 bg-base-100 overflow-auto h-[calc(100vh-4rem)]">
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
                </div>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-base-content/70">該当するアイテムがありません</p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={items.length}
                  next={loadMoreItems}
                  hasMore={totalPages > 1 && currentPage < totalPages}
                  loader={
                    <div className="text-center py-4">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  }
                  endMessage={
                    <div className="text-center py-4">
                      <p className="text-base-content/70">すべてのアイテムを表示しました</p>
                    </div>
                  }
                  scrollableTarget="scrollableDiv"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="card hover:shadow-xl transition-shadow overflow-hidden relative flex flex-col"
                      >
                        <div className="card-body p-4 flex flex-col flex-1">
                          {/* ヘッダー */}
                          <div className="mb-3">
                            {/* ワークスペース名 + ステータス */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="badge badge-soft badge-accent badge-sm truncate p-3">
                                  {item.genreIcon && (
                                    <img
                                      src={`/icons/genres/${item.genreIcon}.svg`}
                                      alt={item.genreName || 'ジャンルアイコン'}
                                      title={item.genreName || 'ジャンル'}
                                      className="w-4 h-4 flex-shrink-0"
                                    />
                                  )}
                                  {item.workspaceName || 'ワークスペース'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {item.isArchived && <span className="badge badge-neutral badge-xs">アーカイブ</span>}
                                {item.isDraft && <span className="badge badge-warning badge-xs">下書き</span>}
                                {item.isPinned && (
                                  <span className="icon-[mdi--pin] w-4 h-4 text-info" aria-hidden="true" />
                                )}
                              </div>
                            </div>

                            {/* アイテムコード */}
                            <span className="text-xs text-base-content/50 font-mono"># {item.code}</span>
                            {/* 件名 */}
                            <Link href={`/workspaces/${item.workspaceCode}?itemCode=${item.code}`}>
                              <h3 className="text-lg font-bold hover:text-primary transition-colors cursor-pointer break-words line-clamp-2">
                                {item.subject || '（件名未設定）'}
                              </h3>
                            </Link>
                          </div>

                          {/* メタ情報 */}
                          <div className="space-y-2 mb-3 flex-1">
                            {/* オーナー */}
                            <div className="flex items-center text-sm gap-2">
                              <span className="text-base-content/70 w-20 flex-shrink-0">オーナー</span>
                              <div className="flex items-center gap-1.5 min-w-0">
                                {item.ownerAvatarUrl && (
                                  <img
                                    src={getDisplayIconUrl(item.ownerAvatarUrl)}
                                    alt=""
                                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                  />
                                )}
                                <span className="truncate">{item.ownerUsername || '-'}</span>
                              </div>
                            </div>

                            {/* 担当者 */}
                            {item.assigneeUsername && (
                              <div className="flex items-center text-sm gap-2">
                                <span className="text-base-content/70 w-20 flex-shrink-0">担当</span>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {item.assigneeAvatarUrl && (
                                    <img
                                      src={getDisplayIconUrl(item.assigneeAvatarUrl)}
                                      alt=""
                                      className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                    />
                                  )}
                                  <span className="truncate">{item.assigneeUsername}</span>
                                </div>
                              </div>
                            )}

                            {/* コミッター */}
                            {item.committerUsername && (
                              <div className="flex items-center text-sm gap-2">
                                <span className="text-base-content/70 w-20 flex-shrink-0">コミッター</span>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {item.committerAvatarUrl && (
                                    <img
                                      src={getDisplayIconUrl(item.committerAvatarUrl)}
                                      alt=""
                                      className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                    />
                                  )}
                                  <span className="truncate">{item.committerUsername}</span>
                                </div>
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
                </InfiniteScroll>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
