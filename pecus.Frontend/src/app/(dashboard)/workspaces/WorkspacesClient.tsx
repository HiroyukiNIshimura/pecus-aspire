'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import { Tooltip } from '@/components/common/feedback/Tooltip';
import GenreSelect from '@/components/workspaces/GenreSelect';
import type {
  MasterGenreResponse,
  PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics,
  WorkspaceListItemResponse,
  WorkspaceStatistics,
} from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useNotify } from '@/hooks/useNotify';
import { useValidation } from '@/hooks/useValidation';
import { formatDate } from '@/libs/utils/date';
import { workspaceNameFilterSchema } from '@/schemas/filterSchemas';
import CreateWorkspaceModal from './CreateWorkspaceModal';

interface WorkspacesClientProps {
  genres: MasterGenreResponse[];
}

export default function WorkspacesClient({ genres }: WorkspacesClientProps) {
  // ワークスペース一覧データはClient側で初期フェッチ
  const [workspaces, setWorkspaces] = useState<WorkspaceListItemResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState<WorkspaceStatistics | null>(null);
  const [filterName, setFilterName] = useState<string>('');
  const [filterGenreId, setFilterGenreId] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const nameValidation = useValidation(workspaceNameFilterSchema);
  const { showLoading, withDelayedLoading } = useDelayedLoading();
  const notify = useNotify();

  // 初期データフェッチ（マウント時に1回だけ実行）
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', '1');

        const response = await fetch(`/api/workspaces?${params.toString()}`);
        if (response.ok && isMounted) {
          const data: PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics = await response.json();
          setWorkspaces(data.data || []);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setStatistics(data.summary || null);
        }
      } catch (error) {
        console.error('Failed to fetch initial workspaces:', error);
        if (isMounted) {
          notify.error('ワークスペース一覧の取得に失敗しました。', true);
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 無限スクロール
  const {
    sentinelRef,
    isLoading: isLoadingMore,
    reset: resetInfiniteScroll,
  } = useInfiniteScroll({
    onLoadMore: async () => {
      await loadMoreWorkspaces();
    },
    hasMore: totalPages > 1 && currentPage < totalPages,
    rootMargin: '200px',
  });

  const loadMoreWorkspaces = async () => {
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      params.append('page', nextPage.toString());
      if (filterName) {
        params.append('Name', filterName);
      }
      if (filterGenreId !== null) {
        params.append('GenreId', filterGenreId.toString());
      }

      const response = await fetch(`/api/workspaces?${params.toString()}`);
      if (response.ok) {
        const data: PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics = await response.json();
        setWorkspaces((prev) => [...prev, ...(data.data || [])]);
        setCurrentPage(data.currentPage || nextPage);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        if (data.summary) {
          setStatistics(data.summary);
        }
      }
    } catch (error) {
      console.error('Failed to load more workspaces:', error);
      notify.error('サーバーとの通信でエラーが発生しました。', true);
    }
  };

  const handleFilterChange = withDelayedLoading(async () => {
    resetInfiniteScroll();
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      if (filterName) {
        params.append('Name', filterName);
      }
      if (filterGenreId !== null) {
        params.append('GenreId', filterGenreId.toString());
      }

      const response = await fetch(`/api/workspaces?${params.toString()}`);
      if (response.ok) {
        const data: PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics = await response.json();
        setWorkspaces(data.data || []);
        setCurrentPage(1);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setStatistics(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to filter workspaces:', error);
      notify.error('サーバーとの通信でエラーが発生しました。', true);
    }
  });

  const handleNameChange = async (value: string) => {
    setFilterName(value);
    await nameValidation.validate(value);
  };

  const handleSearch = async () => {
    const result = await nameValidation.validate(filterName);
    if (result.success) {
      await handleFilterChange();
    }
  };

  const handleReset = async () => {
    setFilterName('');
    setFilterGenreId(null);
    nameValidation.clearErrors();
    resetInfiniteScroll();

    // リセット後の値で直接検索を実行（stateの非同期更新を待たない）
    await withDelayedLoading(async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', '1');

        const response = await fetch(`/api/workspaces?${params.toString()}`);
        if (response.ok) {
          const data: PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics = await response.json();
          setWorkspaces(data.data || []);
          setCurrentPage(1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setStatistics(data.summary || null);
        }
      } catch (error) {
        console.error('Failed to reset workspaces:', error);
        notify.error('サーバーとの通信でエラーが発生しました。', true);
      }
    })();
  };

  const handleCreateSuccess = () => {
    // ワークスペース作成成功時、一覧を再取得
    resetInfiniteScroll();
    handleFilterChange();
  };

  return (
    <>
      <LoadingOverlay
        isLoading={isInitialLoading || showLoading}
        message={isInitialLoading ? '読み込み中...' : '検索中...'}
      />

      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="icon-[mdi--view-grid-outline] text-primary w-8 h-8" aria-hidden="true" />
            <div>
              <h1 className="text-2xl font-bold">マイワークスペース</h1>
              <p className="text-base-content/70 mt-1">アクセス可能なワークスペースの一覧</p>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <span className="icon-[mdi--plus-circle-outline] w-5 h-5" aria-hidden="true" />
            新規作成
          </button>
        </div>
      </div>

      {/* フィルターセクション */}
      <div className="card mb-6">
        <div className="card-body p-4">
          <div
            className="flex items-center justify-between cursor-pointer py-2 mb-4"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <h2 className="card-title text-lg flex items-center gap-2">
              <span className="icon-[mdi--filter-outline] w-5 h-5" aria-hidden="true" />
              <span
                className={`underline decoration-dashed underline-offset-4 hover:decoration-solid transition-colors ${filterName || filterGenreId !== null ? 'text-success' : ''}`}
              >
                フィルター
              </span>
            </h2>
            <svg
              className={`w-5 h-5 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {filterOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
          </div>

          {filterOpen && (
            <div className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* ジャンルフィルター */}
                <div className="form-control">
                  <label htmlFor="filterGenreId" className="label">
                    <span className="label-text">ジャンル</span>
                  </label>
                  <GenreSelect
                    id="filterGenreId"
                    name="filterGenreId"
                    genres={genres}
                    value={filterGenreId}
                    onChange={(value) => setFilterGenreId(value)}
                  />
                </div>

                {/* 名前検索 */}
                <div className="form-control">
                  <label htmlFor="filterName" className="label">
                    <span className="label-text">ワークスペース名</span>
                  </label>
                  <input
                    id="filterName"
                    type="text"
                    placeholder="検索名を入力..."
                    className={`input input-bordered w-full ${nameValidation.hasErrors ? 'input-error' : ''}`}
                    value={filterName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nameValidation.isValid) {
                        handleSearch();
                      }
                    }}
                  />
                  {nameValidation.error && (
                    <div className="label">
                      <span className="label-text-alt text-error">{nameValidation.error}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ボタングループ */}
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn btn-outline" onClick={handleReset}>
                  リセット
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSearch}
                  disabled={!nameValidation.isValid}
                >
                  <span className="icon-[mdi--magnify] w-4 h-4" aria-hidden="true" />
                  検索
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ワークスペース一覧 */}
      <div className="card">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="card-title text-lg">ワークスペース一覧</h2>
              <span className="badge badge-primary">{totalCount}</span>
            </div>
          </div>

          {workspaces.length === 0 ? (
            <EmptyState
              iconClass="icon-[mdi--folder-open-outline]"
              message="ワークスペースが見つかりません"
              description="フィルタ条件を変更してみてください"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="card bg-base-200/50 hover:shadow-xl transition-shadow overflow-hidden relative flex flex-col"
                  >
                    <div className="card-body p-4 flex flex-col flex-1">
                      {/* ヘッダー */}
                      <div className="mb-3">
                        {/* ワークスペース名 */}
                        <div>
                          <Link href={`/workspaces/${workspace.code}`}>
                            <h3 className="text-lg font-bold hover:text-primary transition-colors cursor-pointer wrap-break-word flex items-center gap-2">
                              {workspace.genreIcon && (
                                <img
                                  src={`/icons/genres/${workspace.genreIcon}.svg`}
                                  alt={workspace.genreName || 'ジャンルアイコン'}
                                  title={workspace.genreName || 'ジャンル'}
                                  className="w-6 h-6 flex-shrink-0"
                                />
                              )}
                              <span className="truncate">{workspace.name}</span>
                              {workspace.mode === 'Document' && (
                                <Tooltip text="ドキュメントモード" position="top">
                                  <span
                                    className="icon-[mdi--file-document-outline] w-4 h-4 text-base-content/60"
                                    aria-label="ドキュメントモード"
                                  />
                                </Tooltip>
                              )}
                            </h3>
                          </Link>
                        </div>

                        {/* コード、ステータス、メニュー */}
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <code className="text-xs badge badge-soft badge-accent badge-sm">{workspace.code}</code>
                        </div>
                      </div>

                      {/* 説明 */}
                      {workspace.description && (
                        <p className="text-sm text-base-content/70 line-clamp-2 mb-3 wrap-break-word">
                          {workspace.description}
                        </p>
                      )}

                      {/* フッター - 下部に固定 */}
                      <div className="pt-3 border-t border-base-300 mt-auto space-y-2">
                        {/* ジャンル */}
                        {workspace.genreIcon && workspace.genreName && (
                          <div className="flex items-center gap-2 text-sm text-base-content/70">
                            <span>{workspace.genreName}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="text-base-content/70 flex-shrink-0">メンバー</span>
                          <div className="flex items-center gap-1 font-medium">
                            <span className="icon-[mdi--account-outline] w-4 h-4" aria-hidden="true" />
                            {workspace.memberCount || 0}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="text-base-content/70 flex-shrink-0">作成日</span>
                          <span className="font-medium">{formatDate(workspace.createdAt)}</span>
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
              {!isLoadingMore && currentPage >= totalPages && workspaces.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-base-content/70">すべてのワークスペースを表示しました</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 統計情報カード */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">アクティブ</div>
              <div className="stat-value text-primary">{statistics.activeWorkspaceCount || 0}</div>
              <div className="stat-desc">利用中のワークスペース</div>
            </div>
          </div>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">非アクティブ</div>
              <div className="stat-value text-secondary">{statistics.inactiveWorkspaceCount || 0}</div>
              <div className="stat-desc">停止中のワークスペース</div>
            </div>
          </div>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">総メンバー数</div>
              <div className="stat-value text-accent">{statistics.uniqueMemberCount || 0}</div>
              <div className="stat-desc">全ワークスペース合計</div>
            </div>
          </div>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">最近作成</div>
              <div className="stat-value text-info">{statistics.recentWorkspaceCount || 0}</div>
              <div className="stat-desc">過去30日以内</div>
            </div>
          </div>
        </div>
      )}

      {/* ワークスペース作成モーダル */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        genres={genres}
      />
    </>
  );
}
