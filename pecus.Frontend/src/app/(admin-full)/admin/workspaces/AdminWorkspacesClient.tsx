'use client';

import { useCallback, useEffect, useState } from 'react';
import { deleteWorkspace } from '@/actions/admin/workspace';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ActiveStatusFilter from '@/components/common/ActiveStatusFilter';
import DeleteWorkspaceModal from '@/components/common/DeleteWorkspaceModal';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import Pagination from '@/components/common/Pagination';
import type {
  MasterGenreResponse,
  PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics,
  WorkspaceListItemResponse,
  WorkspaceStatistics,
} from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useNotify } from '@/hooks/useNotify';
import { useValidation } from '@/hooks/useValidation';
import { workspaceNameFilterSchema } from '@/schemas/filterSchemas';
import type { UserInfo } from '@/types/userInfo';

/**
 * ワークスペース管理画面のクライアントコンポーネント
 *
 * 【バリデーション実装サンプル】
 * このコンポーネントは useValidation フックを使用したバリデーションの実装例です。
 *
 * 実装ポイント:
 * 1. useValidation フックでスキーマを渡してバリデーション状態を管理
 * 2. handleNameChange で入力時にリアルタイムバリデーション（非同期）
 * 3. handleSearch で検索実行前にバリデーションチェック
 * 4. nameValidation.hasErrors でエラー時のスタイル切り替え
 * 5. nameValidation.error で最初のエラーメッセージを表示
 * 6. nameValidation.isValid でボタンの有効/無効を制御
 * 7. nameValidation.clearErrors でエラーのクリア
 */

interface AdminWorkspacesClientProps {
  initialUser?: UserInfo | null;
  initialGenres?: MasterGenreResponse[];
}

export default function AdminWorkspacesClient({ initialUser, initialGenres }: AdminWorkspacesClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, _setUserInfo] = useState<UserInfo | null>(initialUser || null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItemResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState<WorkspaceStatistics | null>(null);
  const [filterGenreId, setFilterGenreId] = useState<number | null>(null);
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(true);
  const [filterName, setFilterName] = useState<string>('');
  const [genres, _setGenres] = useState<MasterGenreResponse[]>(initialGenres || []);
  const [filterOpen, setFilterOpen] = useState(false);

  // Deletion modal control
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<WorkspaceListItemResponse | null>(null);

  const handleDeleteClick = useCallback((workspace: WorkspaceListItemResponse) => {
    setWorkspaceToDelete(workspace);
    setIsDeleteModalOpen(true);
  }, []);

  // 【バリデーションフック利用例】
  // useValidation フックを使用してワークスペース名のバリデーションを管理
  // - スキーマ: workspaceNameFilterSchema (最大100文字)
  // - 戻り値: validate, errors, isValid, clearErrors, error, hasErrors
  const nameValidation = useValidation(workspaceNameFilterSchema);
  const notify = useNotify();

  const { showLoading, withDelayedLoading } = useDelayedLoading();

  // 初期データフェッチ（マウント時に1回だけ実行）
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('IsActive', 'true');

        const response = await fetch(`/api/admin/workspaces?${params.toString()}`);
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

  const handlePageChange = withDelayedLoading(async ({ selected }: { selected: number }) => {
    try {
      const page = selected + 1; // react-paginateは0-based
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (filterIsActive !== null) {
        params.append('IsActive', filterIsActive.toString());
      }
      if (filterGenreId !== null) {
        params.append('GenreId', filterGenreId.toString());
      }
      if (filterName) {
        params.append('Name', filterName);
      }
      const response = await fetch(`/api/admin/workspaces?${params.toString()}`);
      if (response.ok) {
        const data: PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics = await response.json();
        setWorkspaces(data.data || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setStatistics(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      notify.error('サーバーとの通信でエラーが発生しました。', true);
    }
  });

  const handleFilterChange = useCallback(async () => {
    setCurrentPage(1);
    await withDelayedLoading(async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', '1');
        if (filterIsActive !== null) {
          params.append('IsActive', filterIsActive.toString());
        }
        if (filterGenreId !== null) {
          params.append('GenreId', filterGenreId.toString());
        }
        if (filterName) {
          params.append('Name', filterName);
        }
        const response = await fetch(`/api/admin/workspaces?${params.toString()}`);
        if (response.ok) {
          const data: PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics = await response.json();
          setWorkspaces(data.data || []);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setStatistics(data.summary || null);
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
        notify.error('サーバーとの通信でエラーが発生しました。', true);
      }
    })();
  }, [filterIsActive, filterGenreId, filterName, withDelayedLoading]); // 【バリデーション実装例 1: リアルタイムバリデーション】
  // 入力時に即座にバリデーションを実行してエラーを表示
  // - 非同期関数として実装（refine/transform対応）
  // - validate() の戻り値は使用せず、フックの状態を参照
  const handleNameChange = async (value: string) => {
    setFilterName(value);
    await nameValidation.validate(value);
  };

  // 【バリデーション実装例 2: 送信前バリデーション】
  // 検索実行前にバリデーションチェックを行う
  // - result.success で成功/失敗を判定
  // - 成功時のみ検索処理を実行
  // - すべてのフィルター条件（名前、ジャンル、ステータス）を一括で適用
  const handleSearch = async () => {
    const result = await nameValidation.validate(filterName);
    if (result.success) {
      handleFilterChange();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <LoadingOverlay
        isLoading={isInitialLoading || showLoading}
        message={isInitialLoading ? '読み込み中...' : '検索中...'}
      />

      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={userInfo} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} loading={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        <AdminSidebar sidebarOpen={sidebarOpen} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 bg-base-100 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">ワークスペース管理</h1>
            </div>

            {/* Filter Section */}
            <div className="card mb-6">
              <div className="card-body">
                <div
                  className="flex items-center justify-between cursor-pointer py-2"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <div className="flex items-center gap-2">
                    <span className="icon-[mdi--filter-outline] w-5 h-5" aria-hidden="true" />
                    <span
                      className={`text-lg font-semibold underline decoration-dashed underline-offset-4 hover:decoration-solid transition-colors ${filterGenreId !== null || filterIsActive !== true || filterName ? 'text-success' : ''}`}
                    >
                      フィルター
                    </span>
                  </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 mb-4">
                      {/* Workspace Name Filter */}
                      {/* 【バリデーション UI 実装例】 */}
                      <div className="form-control">
                        <label htmlFor="filter-name" className="label">
                          <span className="label-text">ワークスペース名</span>
                        </label>
                        {/* 【ポイント1】エラー時のスタイル切り替え: nameValidation.hasErrors */}
                        <input
                          type="text"
                          id="filter-name"
                          className={`input input-bordered w-full ${nameValidation.hasErrors ? 'input-error' : ''}`}
                          placeholder="前方一致検索..."
                          value={filterName}
                          onChange={(e) => handleNameChange(e.target.value)}
                          onKeyDown={(e) => {
                            // 【ポイント2】Enterキーで検索: nameValidation.isValid でバリデーションチェック
                            if (e.key === 'Enter' && nameValidation.isValid) {
                              handleSearch();
                            }
                          }}
                        />
                        {/* 【ポイント3】エラーメッセージ表示: nameValidation.error */}
                        {nameValidation.error && (
                          <div className="label">
                            <span className="label-text-alt text-error">{nameValidation.error}</span>
                          </div>
                        )}
                      </div>

                      {/* Genre Filter */}
                      <div className="form-control">
                        <label htmlFor="filter-genre" className="label">
                          <span className="label-text">ジャンル</span>
                        </label>
                        <select
                          id="filter-genre"
                          className="select select-bordered w-full"
                          value={filterGenreId ?? ''}
                          onChange={(e) => {
                            setFilterGenreId(e.target.value ? parseInt(e.target.value, 10) : null);
                          }}
                        >
                          <option value="">すべて</option>
                          {genres.map((genre) => (
                            <option key={genre.id} value={genre.id}>
                              {genre.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* ActiveStatusFilter */}
                      <ActiveStatusFilter
                        name="workspace-status"
                        value={filterIsActive}
                        onChange={setFilterIsActive}
                        size="xs"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-base-300">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={async () => {
                          // フィルター条件をデフォルト状態にリセット
                          setFilterGenreId(null);
                          setFilterIsActive(true);
                          setFilterName('');
                          // 【ポイント5】エラーのクリア: nameValidation.clearErrors()
                          nameValidation.clearErrors();

                          // リセット後に再検索を実行（デフォルト条件で検索）
                          setCurrentPage(1);
                          await withDelayedLoading(async () => {
                            try {
                              const params = new URLSearchParams();
                              params.append('page', '1');
                              params.append('IsActive', 'true'); // デフォルト: アクティブのみ

                              const response = await fetch(`/api/admin/workspaces?${params.toString()}`);
                              if (response.ok) {
                                const data: PagedResponseOfWorkspaceListItemResponseAndWorkspaceStatistics =
                                  await response.json();
                                setWorkspaces(data.data || []);
                                setCurrentPage(data.currentPage || 1);
                                setTotalPages(data.totalPages || 1);
                                setTotalCount(data.totalCount || 0);
                                setStatistics(data.summary || null);
                              }
                            } catch (error) {
                              console.error('Failed to fetch workspaces after reset:', error);
                            }
                          })();
                        }}
                      >
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

            {/* Workspace List */}
            <div className="card">
              <div className="card-body">
                <h2 className="card-title mb-4">ワークスペース一覧</h2>
                <p className="text-sm text-base-content opacity-70 mb-4">
                  合計: {totalCount} 件 (ページ {currentPage}/{totalPages})
                </p>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>コード</th>
                        <th>ワークスペース名</th>
                        <th>ジャンル</th>
                        <th>参加者数</th>
                        <th>ステータス</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workspaces.map((workspace) => (
                        <tr key={workspace.id}>
                          <td>{workspace.code || '-'}</td>
                          <td className="font-semibold">{workspace.name}</td>
                          <td>
                            <span className="badge badge-outline">{workspace.genreName || '-'}</span>
                          </td>
                          <td>
                            <span className="badge badge-info">{workspace.memberCount ?? 0} 人</span>
                          </td>
                          <td>
                            <div className={`badge ${workspace.isActive ? 'badge-success' : 'badge-neutral'}`}>
                              {workspace.isActive ? 'アクティブ' : '非アクティブ'}
                            </div>
                          </td>
                          <td>
                            {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString('ja-JP') : '不明'}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <a href={`/admin/workspaces/edit/${workspace.id}`} className="btn btn-sm btn-outline">
                                編集
                              </a>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => handleDeleteClick(workspace)}
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            </div>

            {/* Workspace Stats */}
            {(() => {
              const stats = statistics || {
                activeWorkspaceCount: 0,
                inactiveWorkspaceCount: 0,
                totalWorkspaceCount: 0,
                uniqueMemberCount: 0,
                averageMembersPerWorkspace: 0,
                recentWorkspaceCount: 0,
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {/* Total Workspaces */}
                  <div className="card">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="card-title text-base">総ワークスペース数</h3>
                        <span className="badge badge-primary badge-sm">全体</span>
                      </div>
                      <div className="text-3xl font-bold text-primary mb-1">{stats.totalWorkspaceCount}</div>
                      <div className="text-xs text-base-content opacity-70">登録済みワークスペース</div>
                    </div>
                  </div>

                  {/* Active Workspaces */}
                  <div className="card border border-success border-opacity-30">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="card-title text-base">アクティブ</h3>
                        <span className="badge badge-success badge-sm">稼働中</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <div className="text-3xl font-bold text-success">{stats.activeWorkspaceCount}</div>
                        <span className="text-xs text-base-content opacity-70">/ {stats.totalWorkspaceCount}</span>
                      </div>
                      <div className="text-xs text-base-content opacity-70">
                        {(stats.totalWorkspaceCount ?? 0) > 0
                          ? `${Math.round(((stats.activeWorkspaceCount ?? 0) / (stats.totalWorkspaceCount ?? 1)) * 100)}% が稼働中`
                          : '稼働中のワークスペースなし'}
                      </div>
                    </div>
                  </div>

                  {/* Inactive Workspaces */}
                  <div className="card border border-warning border-opacity-30">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="card-title text-base">非アクティブ</h3>
                        <span className="badge badge-warning badge-sm">停止中</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <div className="text-3xl font-bold text-warning">{stats.inactiveWorkspaceCount}</div>
                        <span className="text-xs text-base-content opacity-70">/ {stats.totalWorkspaceCount}</span>
                      </div>
                      <div className="text-xs text-base-content opacity-70">
                        {(stats.totalWorkspaceCount ?? 0) > 0
                          ? `${Math.round(((stats.inactiveWorkspaceCount ?? 0) / (stats.totalWorkspaceCount ?? 1)) * 100)}% が停止中`
                          : '非アクティブなワークスペースなし'}
                      </div>
                    </div>
                  </div>

                  {/* Unique Members */}
                  <div className="card border border-info border-opacity-30">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="card-title text-base">総メンバー数</h3>
                        <span className="badge badge-info badge-sm">ユニーク</span>
                      </div>
                      <div className="text-3xl font-bold text-info mb-1">{stats.uniqueMemberCount}</div>
                      <div className="text-xs text-base-content opacity-70">参加者（重複なし）</div>
                    </div>
                  </div>

                  {/* Average Members */}
                  <div className="card border border-secondary border-opacity-30">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="card-title text-base">平均メンバー数</h3>
                        <span className="badge badge-secondary badge-sm">統計</span>
                      </div>
                      <div className="text-3xl font-bold text-secondary mb-1">
                        {(stats.averageMembersPerWorkspace || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-base-content opacity-70">ワークスペースあたり</div>
                    </div>
                  </div>

                  {/* Recent Workspaces */}
                  <div className="card border border-accent border-opacity-30">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="card-title text-base">最近作成</h3>
                        <span className="badge badge-accent badge-sm">30日以内</span>
                      </div>
                      <div className="text-3xl font-bold text-accent mb-1">{stats.recentWorkspaceCount}</div>
                      <div className="text-xs text-base-content opacity-70">過去30日間に作成</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </main>
      </div>

      {/* 削除確認モーダル */}
      <DeleteWorkspaceModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setWorkspaceToDelete(null);
        }}
        onConfirm={async () => {
          if (!workspaceToDelete) return;
          const result = await deleteWorkspace(workspaceToDelete.id);
          if (result.success) {
            handleFilterChange();
            notify.success('ワークスペースを削除しました');
          } else {
            notify.error(result.message || 'ワークスペースの削除に失敗しました。');
          }
        }}
        workspace={workspaceToDelete}
      />
    </div>
  );
}
