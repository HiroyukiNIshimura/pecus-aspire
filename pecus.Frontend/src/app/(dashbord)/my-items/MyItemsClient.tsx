'use client';

import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import PushPinIcon from '@mui/icons-material/PushPin';
import ViewListIcon from '@mui/icons-material/ViewList';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMyItems } from '@/actions/workspaceItem';
import AppHeader from '@/components/common/AppHeader';
import Pagination from '@/components/common/Pagination';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
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
  { key: 'All', label: 'すべて', icon: <ViewListIcon fontSize="small" /> },
  { key: 'Owner', label: 'オーナー', icon: <PersonIcon fontSize="small" /> },
  { key: 'Assignee', label: '担当', icon: <AssignmentIndIcon fontSize="small" /> },
  { key: 'Committer', label: 'コミッター', icon: <EditIcon fontSize="small" /> },
  { key: 'Pinned', label: 'PIN', icon: <PushPinIcon fontSize="small" /> },
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
  const [isLoading, setIsLoading] = useState(false);

  // フィルター状態
  const [activeFilter, setActiveFilter] = useState<MyItemRelationType | 'All'>('All');

  // notify の最新値を参照するための ref
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // アイテムを取得する関数
  const loadItems = useCallback(async (page: number, relation: MyItemRelationType | 'All') => {
    setIsLoading(true);
    try {
      // 'All' の場合は undefined を渡す
      const relationParam = relation === 'All' ? undefined : relation;
      const result = await fetchMyItems(page, relationParam);

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // フィルター変更ハンドラー
  const handleFilterChange = useCallback(
    (filter: MyItemRelationType | 'All') => {
      setActiveFilter(filter);
      loadItems(1, filter);
    },
    [loadItems],
  );

  // ページ変更ハンドラー
  const handlePageChange = useCallback(
    (page: number) => {
      loadItems(page, activeFilter);
    },
    [loadItems, activeFilter],
  );

  // 初期エラー表示
  useEffect(() => {
    if (fetchError) {
      notify.error(fetchError);
    }
  }, [fetchError, notify]);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader userInfo={userInfo} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
        <main className="flex-1 p-6 bg-base-100">
          <div className="max-w-7xl mx-auto">
            {/* ヘッダー */}
            <div className="flex items-center gap-3 mb-6">
              <AssignmentIcon className="text-primary" sx={{ fontSize: 32 }} />
              <div>
                <h1 className="text-3xl font-bold">マイアイテム</h1>
                <p className="text-base-content/70 text-sm">あなたに関連するワークスペースアイテムの一覧です</p>
              </div>
            </div>

            {/* フィルタータブ */}
            <div className="tabs tabs-boxed mb-6 bg-base-200 p-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleFilterChange(tab.key)}
                  className={`tab gap-1 ${activeFilter === tab.key ? 'tab-active' : ''}`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* 件数表示 */}
            <div className="mb-4 text-sm text-base-content/70">
              {totalCount} 件のアイテム
              {activeFilter !== 'All' && (
                <span className="ml-2 badge badge-primary badge-sm">
                  {filterTabs.find((t) => t.key === activeFilter)?.label}
                </span>
              )}
            </div>

            {/* アイテム一覧 */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : items.length === 0 ? (
              <div className="card bg-base-200 p-8 text-center">
                <p className="text-base-content/70">該当するアイテムがありません。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow"
                  >
                    <div className="card-body p-4">
                      <div className="flex items-start gap-4">
                        {/* アイテム情報 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {/* ワークスペース名 */}
                            {item.workspaceName && (
                              <span className="badge badge-ghost badge-sm truncate max-w-[150px]">
                                {item.workspaceName}
                              </span>
                            )}
                            {/* コード */}
                            {item.code && <code className="text-xs text-base-content/60">{item.code}</code>}
                            {/* ステータスバッジ */}
                            {item.isDraft && <span className="badge badge-warning badge-xs">下書き</span>}
                            {item.isPinned && (
                              <span className="badge badge-info badge-xs gap-0.5">
                                <PushPinIcon style={{ fontSize: '0.7rem' }} />
                              </span>
                            )}
                          </div>

                          {/* 件名 */}
                          <h3 className="font-semibold text-lg truncate">{item.subject || '（件名未設定）'}</h3>

                          {/* メタ情報 */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-base-content/60">
                            {/* オーナー */}
                            {item.ownerUsername && (
                              <div className="flex items-center gap-1">
                                <PersonIcon style={{ fontSize: '0.875rem' }} />
                                <span>オーナー:</span>
                                {item.ownerAvatarUrl && (
                                  <img
                                    src={getDisplayIconUrl(item.ownerAvatarUrl)}
                                    alt={item.ownerUsername}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                )}
                                <span>{item.ownerUsername}</span>
                              </div>
                            )}
                            {/* 担当者 */}
                            {item.assigneeUsername && (
                              <div className="flex items-center gap-1">
                                <AssignmentIndIcon style={{ fontSize: '0.875rem' }} />
                                <span>担当:</span>
                                {item.assigneeAvatarUrl && (
                                  <img
                                    src={getDisplayIconUrl(item.assigneeAvatarUrl)}
                                    alt={item.assigneeUsername}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                )}
                                <span>{item.assigneeUsername}</span>
                              </div>
                            )}
                            {/* 更新日時 */}
                            {item.updatedAt && (
                              <span>更新: {new Date(item.updatedAt).toLocaleDateString('ja-JP')}</span>
                            )}
                          </div>
                        </div>

                        {/* アクション */}
                        <div className="flex-shrink-0">
                          <Link
                            href={`/workspaces/${item.workspaceCode}?itemId=${item.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            開く
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={({ selected }) => handlePageChange(selected + 1)}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-base-200 text-base-content p-4 text-center">
        <p>&copy; 2025 Pecus. All rights reserved.</p>
      </footer>
    </div>
  );
}
