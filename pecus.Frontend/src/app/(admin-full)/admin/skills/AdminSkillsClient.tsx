'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { deleteSkill } from '@/actions/admin/skills';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import ActiveStatusFilter from '@/components/common/filters/ActiveStatusFilter';
import Pagination from '@/components/common/filters/Pagination';
import DeleteConfirmModal from '@/components/common/overlays/DeleteConfirmModal';
import type { SkillListItemResponse, SkillStatistics } from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useNotify } from '@/hooks/useNotify';
import { useValidation } from '@/hooks/useValidation';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import { skillNameFilterSchema } from '@/schemas/filterSchemas';

export default function AdminSkillsClient() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [skills, setSkills] = useState<SkillListItemResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState<SkillStatistics | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // フィルター状態
  const [filterName, setFilterName] = useState<string>('');
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(true);
  const [filterUnusedOnly, setFilterUnusedOnly] = useState<boolean>(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // 削除モーダルの状態
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillListItemResponse | null>(null);

  // バリデーション
  const nameValidation = useValidation(skillNameFilterSchema);
  const { showLoading, withDelayedLoading } = useDelayedLoading();
  const notify = useNotify();

  // 初期データフェッチ（マウント時に1回だけ実行）
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('IsActive', 'true');

        const response = await fetch(`/api/admin/skills?${params.toString()}`);
        if (response.ok && isMounted) {
          const data = await response.json();
          setSkills(data.data || []);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setStatistics(data.summary || null);
        }
      } catch (error) {
        console.error('Failed to fetch initial skills:', error);
        if (isMounted) {
          notify.error('スキル一覧の取得に失敗しました。', true);
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

  // 削除ボタンクリック時のハンドラ
  const handleDeleteClick = useCallback((skill: SkillListItemResponse) => {
    setSkillToDelete(skill);
    setIsDeleteModalOpen(true);
  }, []);

  // ページ変更処理
  const handlePageChange = withDelayedLoading(async ({ selected }: { selected: number }) => {
    try {
      const page = selected + 1; // react-paginateは0-based
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (filterIsActive !== null) {
        params.append('IsActive', filterIsActive.toString());
      }
      if (filterUnusedOnly) {
        params.append('UnusedOnly', 'true');
      }
      if (filterName) {
        params.append('Name', filterName);
      }
      const response = await fetch(`/api/admin/skills?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSkills(data.data || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setStatistics(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    }
  });

  // フィルター変更処理
  const handleFilterChange = useCallback(async () => {
    setCurrentPage(1);
    await withDelayedLoading(async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', '1');
        if (filterIsActive !== null) {
          params.append('IsActive', filterIsActive.toString());
        }
        if (filterUnusedOnly) {
          params.append('UnusedOnly', 'true');
        }
        if (filterName) {
          params.append('Name', filterName);
        }
        const response = await fetch(`/api/admin/skills?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setSkills(data.data || []);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setStatistics(data.summary || null);
        }
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      }
    })();
  }, [filterIsActive, filterUnusedOnly, filterName, withDelayedLoading]);

  // 名前入力変更時のバリデーション
  const handleNameChange = async (value: string) => {
    setFilterName(value);
    await nameValidation.validate(value);
  };

  // 検索処理
  const handleSearch = async () => {
    const result = await nameValidation.validate(filterName);
    if (result.success) {
      handleFilterChange();
    }
  };

  // 日付をYYYY/MM/DD形式にフォーマット
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LoadingOverlay
        isLoading={isInitialLoading || showLoading}
        message={isInitialLoading ? '読み込み中...' : '検索中...'}
      />

      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={currentUser} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} loading={false} />

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
              <h1 className="text-3xl font-bold">スキル管理</h1>
              <button type="button" className="btn btn-primary">
                新規スキル追加
              </button>
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
                      className={`text-lg font-semibold underline decoration-dashed underline-offset-4 hover:decoration-solid transition-colors ${filterIsActive !== true || filterName ? 'text-success' : ''}`}
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
                      {/* スキル名検索 */}
                      <div className="form-control">
                        <label htmlFor="filter-name" className="label">
                          <span className="label-text">スキル名</span>
                        </label>
                        <input
                          type="text"
                          id="filter-name"
                          className={`input input-bordered w-full ${nameValidation.hasErrors ? 'input-error' : ''}`}
                          placeholder="前方一致検索..."
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

                      {/* ActiveStatusFilter */}
                      <ActiveStatusFilter
                        name="skill-status"
                        value={filterIsActive}
                        onChange={setFilterIsActive}
                        size="xs"
                      />

                      {/* 未使用フィルター */}
                      <div className="form-control">
                        <div className="label">
                          <span className="label-text">使用状況</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer" htmlFor="filter-unused">
                          <input
                            id="filter-unused"
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={filterUnusedOnly}
                            onChange={(e) => setFilterUnusedOnly(e.target.checked)}
                          />
                          <span className="text-sm">未使用のみ</span>
                        </label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-base-300">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={async () => {
                          // フィルター条件をデフォルト状態にリセット
                          setFilterName('');
                          setFilterIsActive(true);
                          setFilterUnusedOnly(false);
                          nameValidation.clearErrors();

                          // リセット後に再検索を実行（デフォルト条件で検索）
                          setCurrentPage(1);
                          await withDelayedLoading(async () => {
                            try {
                              const params = new URLSearchParams();
                              params.append('page', '1');
                              params.append('IsActive', 'true'); // デフォルト: アクティブのみ

                              const response = await fetch(`/api/admin/skills?${params.toString()}`);
                              if (response.ok) {
                                const data = await response.json();
                                setSkills(data.data || []);
                                setCurrentPage(data.currentPage || 1);
                                setTotalPages(data.totalPages || 1);
                                setTotalCount(data.totalCount || 0);
                                setStatistics(data.summary || null);
                              } else {
                                const errorData = await response.json().catch(() => ({}));
                                console.error('Reset API error:', {
                                  status: response.status,
                                  error: errorData?.error,
                                  details: errorData?.details,
                                });
                              }
                            } catch (error) {
                              console.error('Failed to fetch skills after reset:', error);
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

            {/* Skill List */}
            <div className="card">
              <div className="card-body">
                <h2 className="card-title mb-4">スキル一覧</h2>
                <p className="text-sm text-base-content opacity-70 mb-4">
                  合計: {totalCount} 件 (ページ {currentPage}/{totalPages})
                </p>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>スキル名</th>
                        <th>説明</th>
                        <th>保有者数</th>
                        <th>ステータス</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skills.map((skill) => (
                        <tr key={skill.id}>
                          <td className="font-bold">{skill.name}</td>
                          <td>{skill.description || '-'}</td>
                          <td>
                            <span className="badge badge-info">{skill.userCount ?? 0}人</span>
                          </td>
                          <td>
                            {skill.isActive ? (
                              <div className="badge badge-success">アクティブ</div>
                            ) : (
                              <div className="badge badge-outline">非アクティブ</div>
                            )}
                          </td>
                          <td>{formatDate(skill.createdAt)}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => router.push(`/admin/skills/edit/${skill.id}`)}
                              >
                                編集
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => handleDeleteClick(skill)}
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

            {/* Skill Statistics */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {/* Total Skills */}
                <div className="card">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">総スキル数</h3>
                      <span className="badge badge-primary badge-sm">全体</span>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">{statistics.totalSkills ?? 0}</div>
                    <div className="text-xs text-base-content opacity-70">登録済みスキル</div>
                  </div>
                </div>

                {/* Active Skills */}
                <div className="card border border-success border-opacity-30">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">アクティブ</h3>
                      <span className="badge badge-success badge-sm">有効</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className="text-3xl font-bold text-success">{statistics.activeSkills ?? 0}</div>
                      <span className="text-xs text-base-content opacity-70">/ {statistics.totalSkills ?? 0}</span>
                    </div>
                    <div className="text-xs text-base-content opacity-70">
                      {(statistics.totalSkills ?? 0) > 0
                        ? `${Math.round(((statistics.activeSkills ?? 0) / (statistics.totalSkills ?? 1)) * 100)}% が有効`
                        : '有効なスキルなし'}
                    </div>
                  </div>
                </div>

                {/* Inactive Skills */}
                <div className="card border border-warning border-opacity-30">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">非アクティブ</h3>
                      <span className="badge badge-warning badge-sm">無効</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className="text-3xl font-bold text-warning">{statistics.inactiveSkills ?? 0}</div>
                      <span className="text-xs text-base-content opacity-70">/ {statistics.totalSkills ?? 0}</span>
                    </div>
                    <div className="text-xs text-base-content opacity-70">
                      {(statistics.totalSkills ?? 0) > 0
                        ? `${Math.round(((statistics.inactiveSkills ?? 0) / (statistics.totalSkills ?? 1)) * 100)}% が無効`
                        : '無効なスキルなし'}
                    </div>
                  </div>
                </div>

                {/* Unused Skills */}
                <div className="card border border-error border-opacity-30">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">未使用スキル</h3>
                      <span className="badge badge-error badge-sm">0人</span>
                    </div>
                    <div className="text-3xl font-bold text-error mb-1">{statistics.unusedSkills?.length ?? 0}</div>
                    <div className="text-xs text-base-content opacity-70">保有者がいないスキル</div>
                  </div>
                </div>

                {/* Top 5 Skills */}
                <div className="card border border-info border-opacity-30 md:col-span-2">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">人気スキル TOP5</h3>
                      <span className="badge badge-info badge-sm">保有者数</span>
                    </div>
                    {statistics.topUsedSkills && statistics.topUsedSkills.length > 0 ? (
                      <div className="space-y-2">
                        {statistics.topUsedSkills.slice(0, 5).map((skill, index) => (
                          <div key={skill.id ?? index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="badge badge-neutral badge-sm">{index + 1}</span>
                              <span className="text-sm font-medium">{skill.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-base-content opacity-70">データがありません</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSkillToDelete(null);
        }}
        onConfirm={async () => {
          if (!skillToDelete) return;
          const result = await deleteSkill(skillToDelete.id);
          if (result.success) {
            handleFilterChange();
            notify.success('スキルを削除しました');
          } else {
            notify.error(result.message || 'スキルの削除に失敗しました。');
          }
        }}
        itemType="スキル"
        itemName={skillToDelete?.name || ''}
        additionalWarning={
          skillToDelete?.userCount && skillToDelete.userCount > 0
            ? `このスキルは${skillToDelete.userCount}人のユーザーに関連付けられています。`
            : undefined
        }
      />
    </div>
  );
}
