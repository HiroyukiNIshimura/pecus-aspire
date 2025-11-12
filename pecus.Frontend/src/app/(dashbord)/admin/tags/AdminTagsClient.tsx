"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import Pagination from "@/components/common/Pagination";
import type {
  TagListItemResponse,
  TagStatistics,
} from "@/connectors/api/pecus";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useValidation } from "@/hooks/useValidation";
import { tagNameFilterSchema } from "@/schemas/filterSchemas";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface AdminTagsClientProps {
  initialUser?: UserInfo | null;
  initialTags?: TagListItemResponse[];
  initialTotalCount?: number;
  initialTotalPages?: number;
  initialStatistics?: TagStatistics | null;
  fetchError?: string | null;
}

export default function AdminTagsClient({
  initialUser,
  initialTags,
  initialTotalCount,
  initialTotalPages,
  initialStatistics,
  fetchError,
}: AdminTagsClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);
  const [tags, setTags] = useState<TagListItemResponse[]>(initialTags || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
  const [statistics, setStatistics] = useState<TagStatistics | null>(
    initialStatistics || null,
  );

  // フィルター状態
  const [filterName, setFilterName] = useState<string>("");
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(true);
  const [filterUnusedOnly, setFilterUnusedOnly] = useState<boolean>(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // バリデーション
  const nameValidation = useValidation(tagNameFilterSchema);
  const { showLoading, withDelayedLoading } = useDelayedLoading();

  // ページ変更処理
  const handlePageChange = withDelayedLoading(
    async ({ selected }: { selected: number }) => {
      try {
        const page = selected + 1; // react-paginateは0-based
        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (filterIsActive !== null) {
          params.append("IsActive", filterIsActive.toString());
        }
        if (filterUnusedOnly) {
          params.append("UnusedOnly", "true");
        }
        if (filterName) {
          params.append("Name", filterName);
        }
        const response = await fetch(`/api/admin/tags?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTags(data.data || []);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setStatistics(data.summary || null);
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    },
  );

  // フィルター変更処理
  const handleFilterChange = useCallback(async () => {
    setCurrentPage(1);
    await withDelayedLoading(async () => {
      try {
        const params = new URLSearchParams();
        params.append("page", "1");
        if (filterIsActive !== null) {
          params.append("IsActive", filterIsActive.toString());
        }
        if (filterUnusedOnly) {
          params.append("UnusedOnly", "true");
        }
        if (filterName) {
          params.append("Name", filterName);
        }
        const response = await fetch(`/api/admin/tags?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTags(data.data || []);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setStatistics(data.summary || null);
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
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
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LoadingOverlay isLoading={showLoading} message="検索中..." />

      {/* Sticky Navigation Header */}
      <AdminHeader
        userInfo={userInfo}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={false}
      />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 bg-base-100">
          <div className="max-w-7xl mx-auto">
            {/* Error Alert */}
            {fetchError && (
              <div className="alert alert-error mb-6" role="alert">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m6-6l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2"
                  />
                </svg>
                <span>{fetchError}</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">タグ管理</h1>
              <button className="btn btn-primary">新規作成</button>
            </div>

            {/* Filter Section */}
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <div
                  className="flex items-center justify-between cursor-pointer py-2"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <span
                    className={`text-lg font-semibold underline decoration-dashed underline-offset-4 hover:decoration-solid transition-colors ${filterName || filterIsActive !== true || filterUnusedOnly ? "text-success" : ""}`}
                  >
                    フィルター
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${filterOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {filterOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    ) : (
                      <>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </>
                    )}
                  </svg>
                </div>

                {filterOpen && (
                  <div className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* タグ名検索 */}
                      <div className="form-control">
                        <label htmlFor="filter-name" className="label">
                          <span className="label-text">タグ名</span>
                        </label>
                        <input
                          type="text"
                          id="filter-name"
                          className={`input input-bordered w-full ${nameValidation.hasErrors ? "input-error" : ""}`}
                          placeholder="前方一致検索..."
                          value={filterName}
                          onChange={(e) => handleNameChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && nameValidation.isValid) {
                              handleSearch();
                            }
                          }}
                        />
                        {nameValidation.error && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {nameValidation.error}
                            </span>
                          </label>
                        )}
                      </div>

                      {/* アクティブ状態フィルター */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">ステータス</span>
                        </label>
                        <div className="flex gap-4 items-center h-12">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              className="radio radio-sm"
                              checked={filterIsActive === true}
                              onChange={() => setFilterIsActive(true)}
                            />
                            <span className="text-sm">アクティブ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              className="radio radio-sm"
                              checked={filterIsActive === false}
                              onChange={() => setFilterIsActive(false)}
                            />
                            <span className="text-sm">非アクティブ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              className="radio radio-sm"
                              checked={filterIsActive === null}
                              onChange={() => setFilterIsActive(null)}
                            />
                            <span className="text-sm">すべて</span>
                          </label>
                        </div>
                      </div>

                      {/* 未使用フィルター */}
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">使用状況</span>
                        </label>
                        <div className="flex items-center h-12">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              id="filter-unused"
                              type="checkbox"
                              className="checkbox"
                              checked={filterUnusedOnly}
                              onChange={(e) =>
                                setFilterUnusedOnly(e.target.checked)
                              }
                            />
                            <span className="text-sm">未使用のみ</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-base-300">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleSearch}
                        disabled={!nameValidation.isValid}
                      >
                        検索
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={async () => {
                          // フィルター条件をデフォルト状態にリセット
                          setFilterName("");
                          setFilterIsActive(true);
                          setFilterUnusedOnly(false);
                          nameValidation.clearErrors();

                          // リセット後に再検索を実行（デフォルト条件で検索）
                          setCurrentPage(1);
                          await withDelayedLoading(async () => {
                            try {
                              const params = new URLSearchParams();
                              params.append("page", "1");
                              params.append("IsActive", "true"); // デフォルト: アクティブのみ

                              const response = await fetch(
                                `/api/admin/tags?${params.toString()}`,
                              );
                              if (response.ok) {
                                const data = await response.json();
                                setTags(data.data || []);
                                setCurrentPage(data.currentPage || 1);
                                setTotalPages(data.totalPages || 1);
                                setTotalCount(data.totalCount || 0);
                                setStatistics(data.summary || null);
                              } else {
                                const errorData = await response
                                  .json()
                                  .catch(() => ({}));
                                console.error("Reset API error:", {
                                  status: response.status,
                                  error: errorData?.error,
                                  details: errorData?.details,
                                });
                              }
                            } catch (error) {
                              console.error(
                                "Failed to fetch tags after reset:",
                                error,
                              );
                            }
                          })();
                        }}
                      >
                        リセット
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags Table */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">タグ一覧</h2>
                <p className="text-sm text-base-content opacity-70 mb-4">
                  合計: {totalCount} 件 (ページ {currentPage}/{totalPages})
                </p>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>タグ名</th>
                        <th>参照アイテム</th>
                        <th>ステータス</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags.map((tag) => (
                        <tr key={tag.id}>
                          <td className="font-semibold">{tag.name}</td>
                          <td>
                            <span className="badge badge-info">
                              {tag.itemCount ?? 0}個
                            </span>
                          </td>
                          <td>
                            <div
                              className={`badge ${tag.isActive ? "badge-success" : "badge-neutral"}`}
                            >
                              {tag.isActive ? "アクティブ" : "非アクティブ"}
                            </div>
                          </td>
                          <td>{formatDate(tag.createdAt)}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() =>
                                  router.push(`/admin/tags/edit/${tag.id}`)
                                }
                              >
                                編集
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error"
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
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>

            {/* Tag Statistics */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {/* Total Tags */}
                <div className="card bg-base-100 shadow-xl border border-base-300">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">総タグ数</h3>
                      <span className="badge badge-primary badge-sm">全体</span>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {statistics.totalTags ?? 0}
                    </div>
                    <div className="text-xs text-base-content opacity-70">
                      登録済みタグ
                    </div>
                  </div>
                </div>

                {/* Active Tags */}
                <div className="card bg-base-100 shadow-xl border border-success border-opacity-30">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">アクティブ</h3>
                      <span className="badge badge-success badge-sm">有効</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className="text-3xl font-bold text-success">
                        {statistics.activeTags ?? 0}
                      </div>
                      <span className="text-xs text-base-content opacity-70">
                        / {statistics.totalTags ?? 0}
                      </span>
                    </div>
                    <div className="text-xs text-base-content opacity-70">
                      {(statistics.totalTags ?? 0) > 0
                        ? `${Math.round(((statistics.activeTags ?? 0) / (statistics.totalTags ?? 1)) * 100)}% が有効`
                        : "有効なタグなし"}
                    </div>
                  </div>
                </div>

                {/* Inactive Tags */}
                <div className="card bg-base-100 shadow-xl border border-warning border-opacity-30">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">非アクティブ</h3>
                      <span className="badge badge-warning badge-sm">無効</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className="text-3xl font-bold text-warning">
                        {statistics.inactiveTags ?? 0}
                      </div>
                      <span className="text-xs text-base-content opacity-70">
                        / {statistics.totalTags ?? 0}
                      </span>
                    </div>
                    <div className="text-xs text-base-content opacity-70">
                      {(statistics.totalTags ?? 0) > 0
                        ? `${Math.round(((statistics.inactiveTags ?? 0) / (statistics.totalTags ?? 1)) * 100)}% が無効`
                        : "無効なタグなし"}
                    </div>
                  </div>
                </div>

                {/* Unused Tags */}
                <div className="card bg-base-100 shadow-xl border border-error border-opacity-30">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">未使用タグ</h3>
                      <span className="badge badge-error badge-sm">0個</span>
                    </div>
                    <div className="text-3xl font-bold text-error mb-1">
                      {statistics.unusedTags?.length ?? 0}
                    </div>
                    <div className="text-xs text-base-content opacity-70">
                      利用されていないタグ
                    </div>
                  </div>
                </div>

                {/* Top 5 Tags */}
                <div className="card bg-base-100 shadow-xl border border-info border-opacity-30 md:col-span-2">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="card-title text-base">人気タグ TOP5</h3>
                      <span className="badge badge-info badge-sm">利用数</span>
                    </div>
                    {statistics.topUsedTags &&
                    statistics.topUsedTags.length > 0 ? (
                      <div className="space-y-2">
                        {statistics.topUsedTags
                          .slice(0, 5)
                          .map((tag, index) => (
                            <div
                              key={tag.id ?? index}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="badge badge-neutral badge-sm">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium">
                                  {tag.name}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-base-content opacity-70">
                        データがありません
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <AdminFooter />
    </div>
  );
}
