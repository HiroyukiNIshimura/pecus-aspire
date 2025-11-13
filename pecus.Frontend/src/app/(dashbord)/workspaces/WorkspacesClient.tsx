"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import AppHeader from "@/components/common/AppHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import type {
  WorkspaceListItemResponse,
  WorkspaceListItemResponseWorkspaceStatisticsPagedResponse,
  WorkspaceStatistics,
} from "@/connectors/api/pecus";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useValidation } from "@/hooks/useValidation";
import { workspaceNameFilterSchema } from "@/schemas/filterSchemas";
import GridViewIcon from "@mui/icons-material/GridView";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonIcon from "@mui/icons-material/Person";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import PowerOffIcon from "@mui/icons-material/PowerOff";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface WorkspacesClientProps {
  initialUser?: UserInfo | null;
  fetchError?: string | null;
}

export default function WorkspacesClient({
  initialUser,
  fetchError,
}: WorkspacesClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(
    initialUser || null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItemResponse[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState<WorkspaceStatistics | null>(
    null,
  );
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(true);
  const [filterName, setFilterName] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);

  const nameValidation = useValidation(workspaceNameFilterSchema);
  const { showLoading, withDelayedLoading } = useDelayedLoading();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch("/api/workspaces?page=1&IsActive=true");
        if (response.ok) {
          const data: WorkspaceListItemResponseWorkspaceStatisticsPagedResponse =
            await response.json();
          setWorkspaces(data.data || []);
          setCurrentPage(data.currentPage || 1);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setStatistics(data.summary || null);
        }
      } catch (error) {
        console.error("Failed to fetch initial workspaces:", error);
      }
      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  const loadMoreWorkspaces = async () => {
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      params.append("page", nextPage.toString());
      if (filterIsActive !== null) {
        params.append("IsActive", filterIsActive.toString());
      }
      if (filterName) {
        params.append("Name", filterName);
      }

      const response = await fetch(`/api/workspaces?${params.toString()}`);
      if (response.ok) {
        const data: WorkspaceListItemResponseWorkspaceStatisticsPagedResponse =
          await response.json();
        setWorkspaces((prev) => [...prev, ...(data.data || [])]);
        setCurrentPage(data.currentPage || nextPage);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        if (data.summary) {
          setStatistics(data.summary);
        }
      }
    } catch (error) {
      console.error("Failed to load more workspaces:", error);
    }
  };

  const handleFilterChange = withDelayedLoading(async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", "1");
      if (filterIsActive !== null) {
        params.append("IsActive", filterIsActive.toString());
      }
      if (filterName) {
        params.append("Name", filterName);
      }

      const response = await fetch(`/api/workspaces?${params.toString()}`);
      if (response.ok) {
        const data: WorkspaceListItemResponseWorkspaceStatisticsPagedResponse =
          await response.json();
        setWorkspaces(data.data || []);
        setCurrentPage(1);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setStatistics(data.summary || null);
      }
    } catch (error) {
      console.error("Failed to filter workspaces:", error);
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

  const handleReset = () => {
    setFilterName("");
    setFilterIsActive(true);
    nameValidation.clearErrors();
    handleFilterChange();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isAdmin={userInfo?.isAdmin || false}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userInfo={userInfo}
        />
        <main id="scrollableDiv" className="flex-1 overflow-y-auto bg-base-100 p-4 md:p-6">
          {showLoading && <LoadingOverlay isLoading={showLoading} />}

          {/* ページヘッダー */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GridViewIcon />
              マイワークスペース
            </h1>
            <p className="text-base-content/70 mt-1">
              アクセス可能なワークスペースの一覧
            </p>
          </div>

          {/* 統計情報カード */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">アクティブ</div>
                  <div className="stat-value text-primary">
                    {statistics.activeWorkspaceCount || 0}
                  </div>
                  <div className="stat-desc">利用中のワークスペース</div>
                </div>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">非アクティブ</div>
                  <div className="stat-value text-secondary">
                    {statistics.inactiveWorkspaceCount || 0}
                  </div>
                  <div className="stat-desc">停止中のワークスペース</div>
                </div>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">総メンバー数</div>
                  <div className="stat-value text-accent">
                    {statistics.uniqueMemberCount || 0}
                  </div>
                  <div className="stat-desc">全ワークスペース合計</div>
                </div>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">最近作成</div>
                  <div className="stat-value text-info">
                    {statistics.recentWorkspaceCount || 0}
                  </div>
                  <div className="stat-desc">過去30日以内</div>
                </div>
              </div>
            </div>
          )}

          {/* フィルターセクション */}
          <div className="card bg-base-200 shadow-md mb-6">
            <div className="card-body p-4">
              <div
                className="flex items-center justify-between cursor-pointer py-2 mb-4"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <h2 className="card-title text-lg flex items-center gap-2">
                  <FilterListIcon />
                  <span
                    className={`underline decoration-dashed underline-offset-4 hover:decoration-solid transition-colors ${filterIsActive !== true || filterName ? "text-success" : ""}`}
                  >
                    フィルター
                  </span>
                </h2>
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
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 名前検索 */}
                  <div className="form-control">
                    <label htmlFor="filterName" className="label">
                      <span className="label-text font-semibold">
                        ワークスペース名
                      </span>
                    </label>
                    <input
                      id="filterName"
                      type="text"
                      placeholder="検索名を入力..."
                      className={`input input-bordered ${nameValidation.hasErrors ? "input-error" : ""}`}
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

                  {/* ステータスフィルター */}
                  <div className="form-control">
                    <label htmlFor="filterIsActive" className="label">
                      <span className="label-text font-semibold">
                        ステータス
                      </span>
                    </label>
                    <select
                      id="filterIsActive"
                      className="select select-bordered"
                      value={
                        filterIsActive === null
                          ? ""
                          : filterIsActive
                            ? "true"
                            : "false"
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setFilterIsActive(
                          value === "" ? null : value === "true",
                        );
                      }}
                    >
                      <option value="">すべて</option>
                      <option value="true">アクティブ</option>
                      <option value="false">非アクティブ</option>
                    </select>
                  </div>
                </div>

                {/* ボタングループ */}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleReset}
                  >
                    リセット
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={!nameValidation.isValid}
                  >
                    <SearchIcon className="w-4 h-4" />
                    検索
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* ワークスペース一覧 */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg">
                  ワークスペース一覧
                  <span className="badge badge-primary">{totalCount}</span>
                </h2>
              </div>

              {workspaces.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-base-content/70">
                    ワークスペースが見つかりません
                  </p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={workspaces.length}
                  next={loadMoreWorkspaces}
                  hasMore={currentPage < totalPages}
                  loader={
                    <div className="text-center py-4">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  }
                  endMessage={
                    <div className="text-center py-4">
                      <p className="text-base-content/70">
                        すべてのワークスペースを表示しました
                      </p>
                    </div>
                  }
                  scrollableTarget="scrollableDiv"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                      >
                        <div className="card-body p-4">
                          {/* ヘッダー */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-bold truncate">
                                {workspace.name}
                              </h3>
                              <code className="text-xs badge badge-ghost badge-sm mt-1 truncate max-w-full block">
                                {workspace.code}
                              </code>
                            </div>
                            <div className="flex-shrink-0">
                              {workspace.isActive ? (
                                <div className="badge badge-success badge-sm">
                                  <PowerSettingsNewIcon className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="badge badge-neutral badge-sm">
                                  <PowerOffIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 説明 */}
                          {workspace.description && (
                            <p className="text-sm text-base-content/70 line-clamp-2 mb-3 break-words">
                              {workspace.description}
                            </p>
                          )}

                          {/* メタ情報 */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-sm gap-2">
                              <span className="text-base-content/70 flex-shrink-0">
                                メンバー
                              </span>
                              <div className="flex items-center gap-1 font-medium">
                                <PersonIcon className="w-4 h-4" />
                                {workspace.memberCount || 0}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm gap-2">
                              <span className="text-base-content/70 flex-shrink-0">
                                作成日
                              </span>
                              <span className="font-medium">
                                {workspace.createdAt
                                  ? new Date(
                                      workspace.createdAt,
                                    ).toLocaleDateString("ja-JP")
                                  : "-"}
                              </span>
                            </div>
                          </div>

                          {/* フッター（ジャンル） */}
                          {workspace.genreIcon && workspace.genreName && (
                            <div className="pt-3 border-t border-base-300">
                              <div className="flex items-center gap-2 text-sm text-base-content/70">
                                <span className="text-lg">{workspace.genreIcon}</span>
                                <span>{workspace.genreName}</span>
                              </div>
                            </div>
                          )}
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
