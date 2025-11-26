"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import AppHeader from "@/components/common/AppHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import DeleteWorkspaceModal from "@/components/common/DeleteWorkspaceModal";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import EditWorkspaceModal from "./EditWorkspaceModal";
import type {
  WorkspaceListItemResponse,
  WorkspaceListItemResponseWorkspaceStatisticsPagedResponse,
  WorkspaceStatistics,
  MasterGenreResponse,
} from "@/connectors/api/pecus";
import { toggleWorkspaceActive } from "@/actions/workspace";
import { deleteWorkspace } from "@/actions/deleteWorkspace";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useNotify } from "@/hooks/useNotify";
import { useValidation } from "@/hooks/useValidation";
import { workspaceNameFilterSchema } from "@/schemas/filterSchemas";
import GridViewIcon from "@mui/icons-material/GridView";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonIcon from "@mui/icons-material/Person";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import PowerOffIcon from "@mui/icons-material/PowerOff";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import type { UserInfo } from "@/types/userInfo";

interface WorkspacesClientProps {
  initialUser?: UserInfo | null;
  fetchError?: string | null;
  genres: MasterGenreResponse[];
}

export default function WorkspacesClient({
  initialUser,
  fetchError,
  genres,
}: WorkspacesClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(
    initialUser || null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItemResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState<WorkspaceStatistics | null>(
    null,
  );
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(true);
  const [filterName, setFilterName] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] =
    useState<WorkspaceListItemResponse | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] =
    useState<WorkspaceListItemResponse | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const nameValidation = useValidation(workspaceNameFilterSchema);
  const { showLoading, withDelayedLoading } = useDelayedLoading();
  const notify = useNotify();

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

  const handleCreateSuccess = () => {
    // ワークスペース作成成功時、一覧を再取得
    handleFilterChange();
  };

  const handleEditSuccess = () => {
    // ワークスペース更新成功時、一覧を再取得
    handleFilterChange();
  };

  const handleMenuToggle = (workspaceId: number) => {
    setOpenMenuId(openMenuId === workspaceId ? null : workspaceId);
  };

  const handleEdit = (workspace: WorkspaceListItemResponse) => {
    setEditingWorkspace(workspace);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleToggleActive = async (workspace: WorkspaceListItemResponse) => {
    setOpenMenuId(null);

    try {
      const result = await toggleWorkspaceActive(
        workspace.id,
        !workspace.isActive,
      );

      if (result.success) {
        // 一覧を再取得
        await handleFilterChange();
        notify.success(
          workspace.isActive
            ? "ワークスペースを無効化しました"
            : "ワークスペースを有効化しました",
        );
      } else {
        // エラー表示
        notify.error(result.message || "状態の切り替えに失敗しました。");
      }
    } catch (error) {
      console.error("Toggle active failed:", error);
      notify.error("状態の切り替えに失敗しました。");
    }
  };

  const handleDelete = (workspace: WorkspaceListItemResponse) => {
    setDeletingWorkspace(workspace);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWorkspace) return;

    try {
      const result = await deleteWorkspace(deletingWorkspace.id);

      if (result.success) {
        // 一覧を再取得
        await handleFilterChange();
        notify.success("ワークスペースを削除しました");
      } else {
        // エラー表示
        notify.error(result.message || "ワークスペースの削除に失敗しました。");
      }
    } catch (error) {
      console.error("Delete workspace failed:", error);
      notify.error("ワークスペースの削除に失敗しました。");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        userInfo={userInfo}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <DashboardSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isAdmin={userInfo?.isAdmin || false}
        />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main
          id="scrollableDiv"
          className="flex-1 p-4 md:p-6 bg-base-100"
          onClick={() => setOpenMenuId(null)}
        >
          {showLoading && <LoadingOverlay isLoading={showLoading} />}

          {/* ページヘッダー */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <GridViewIcon />
                  マイワークスペース
                </h1>
                <p className="text-base-content/70 mt-1">
                  アクセス可能なワークスペースの一覧
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <AddIcon />
                新規作成
              </button>
            </div>
          </div>

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
                <div className="flex items-center gap-3">
                  <h2 className="card-title text-lg">ワークスペース一覧</h2>
                  <span className="badge badge-primary">{totalCount}</span>
                </div>
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
                        className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden relative flex flex-col"
                      >
                        <div className="card-body p-4 flex flex-col flex-1">
                          {/* ヘッダー */}
                          <div className="mb-3">
                            {/* コード、ステータス、メニュー */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <code className="text-xs badge badge-ghost badge-sm">
                                {workspace.code}
                              </code>
                              <div className="flex items-center gap-2">
                                {workspace.isActive ? (
                                  <div className="badge badge-success badge-sm">
                                    <PowerSettingsNewIcon className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="badge badge-neutral badge-sm">
                                    <PowerOffIcon className="w-4 h-4" />
                                  </div>
                                )}
                                {/* アクションメニュー */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs btn-circle"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMenuToggle(workspace.id);
                                    }}
                                    aria-label="アクション"
                                  >
                                    <MoreVertIcon className="w-4 h-4" />
                                  </button>
                                  {openMenuId === workspace.id && (
                                    <ul className="absolute right-0 top-8 menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-xl border border-base-300">
                                      <li>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(workspace);
                                          }}
                                          className="flex items-center gap-2"
                                        >
                                          <EditIcon className="w-4 h-4" />
                                          <span>編集</span>
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleActive(workspace);
                                          }}
                                          className="flex items-center gap-2"
                                        >
                                          {workspace.isActive ? (
                                            <>
                                              <ToggleOffIcon className="w-4 h-4" />
                                              <span>無効化</span>
                                            </>
                                          ) : (
                                            <>
                                              <ToggleOnIcon className="w-4 h-4" />
                                              <span>有効化</span>
                                            </>
                                          )}
                                        </button>
                                      </li>
                                      {userInfo?.isAdmin && (
                                        <>
                                          <div className="divider my-0"></div>
                                          <li>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(workspace);
                                              }}
                                              className="flex items-center gap-2 text-error hover:bg-error hover:text-error-content"
                                            >
                                              <DeleteIcon className="w-4 h-4" />
                                              <span>削除</span>
                                            </button>
                                          </li>
                                        </>
                                      )}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ワークスペース名 */}
                            <div>
                              <Link href={`/workspaces/${workspace.code}`}>
                                <h3 className="text-lg font-bold hover:text-primary transition-colors cursor-pointer break-words">
                                  {workspace.name}
                                </h3>
                              </Link>
                            </div>
                          </div>

                          {/* 説明 */}
                          {workspace.description && (
                            <p className="text-sm text-base-content/70 line-clamp-2 mb-3 break-words">
                              {workspace.description}
                            </p>
                          )}

                          {/* メタ情報 */}
                          <div className="space-y-2 mb-3 flex-1">
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

                          {/* フッター（ジャンル） - 下部に固定 */}
                          {workspace.genreIcon && workspace.genreName && (
                            <div className="pt-3 border-t border-base-300 mt-auto">
                              <div className="flex items-center gap-2 text-sm text-base-content/70">
                                <span className="text-lg">
                                  {workspace.genreIcon}
                                </span>
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

          {/* 統計情報カード */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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
        </main>
      </div>

      {/* ワークスペース作成モーダル */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        genres={genres}
      />

      {/* ワークスペース編集モーダル */}
      <EditWorkspaceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingWorkspace(null);
        }}
        onSuccess={handleEditSuccess}
        workspace={editingWorkspace}
        genres={genres}
      />

      {/* ワークスペース削除モーダル */}
      <DeleteWorkspaceModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingWorkspace(null);
        }}
        onConfirm={handleDeleteConfirm}
        workspace={deletingWorkspace}
      />
    </div>
  );
}
