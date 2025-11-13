"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import Pagination from "@/components/common/Pagination";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useValidation } from "@/hooks/useValidation";
import { usernameFilterSchema } from "@/schemas/filterSchemas";
import type { UserInfo } from "@/types/userInfo";

interface Skill {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  skills?: Skill[];
}

interface UserStatistics {
  skillCounts?: Array<{ id: number; name: string; count: number }>;
  roleCounts?: Array<{ id: number; name: string; count: number }>;
  activeUserCount?: number;
  inactiveUserCount?: number;
  workspaceParticipationCount?: number;
  noWorkspaceParticipationCount?: number;
}

interface AdminUsersClientProps {
  initialUsers?: User[];
  initialTotalCount?: number;
  initialTotalPages?: number;
  initialUser?: UserInfo | null;
  initialStatistics?: UserStatistics | null;
  initialSkills?: Skill[];
  fetchError?: string | null;
}

export default function AdminUsersClient({
  initialUsers,
  initialTotalCount,
  initialTotalPages,
  initialUser,
  initialStatistics,
  initialSkills,
  fetchError,
}: AdminUsersClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
  const [statistics, setStatistics] = useState<UserStatistics | null>(
    initialStatistics || null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>(initialSkills || []);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterUsername, setFilterUsername] = useState<string>("");
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(true);
  const [filterSkillIds, setFilterSkillIds] = useState<number[]>([]);
  const [filterSkillMode, setFilterSkillMode] = useState<"and" | "or">("and");

  const { showLoading, withDelayedLoading } = useDelayedLoading();
  const usernameValidation = useValidation(usernameFilterSchema);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!initialUsers || initialUsers.length === 0) {
        try {
          const response = await fetch("/api/admin/users?page=1&IsActive=true");
          if (response.ok) {
            const data = await response.json();
            if (data && data.data) {
              const mappedUsers = data.data.map((user: any) => ({
                id: user.id ?? 0,
                username: user.username ?? "",
                email: user.email ?? "",
                isActive: user.isActive ?? true,
                createdAt: user.createdAt ?? new Date().toISOString(),
                skills: user.skills ?? [],
              }));
              setUsers(mappedUsers);
              setCurrentPage(data.currentPage || 1);
              setTotalPages(data.totalPages || 1);
              setTotalCount(data.totalCount || 0);
              setStatistics(data.summary || null);
            }
          }
        } catch (error) {
          console.error("Failed to fetch initial users:", error);
        }
      }
      setIsLoading(false);
    };

    fetchInitialData();
  }, [initialUsers]);

  const handlePageChange = withDelayedLoading(
    async ({ selected }: { selected: number }) => {
      try {
        const page = selected + 1;
        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (filterIsActive !== null) {
          params.append("IsActive", filterIsActive.toString());
        }
        if (filterUsername) {
          params.append("Username", filterUsername);
        }
        if (filterSkillIds.length > 0) {
          filterSkillIds.forEach((skillId) =>
            params.append("SkillIds", skillId.toString()),
          );
          params.append("SkillFilterMode", filterSkillMode);
        }
        const response = await fetch(`/api/admin/users?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            const mappedUsers = data.data.map((user: any) => ({
              id: user.id ?? 0,
              username: user.username ?? "",
              email: user.email ?? "",
              isActive: user.isActive ?? true,
              createdAt: user.createdAt ?? new Date().toISOString(),
              skills: user.skills ?? [],
            }));
            setUsers(mappedUsers);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
            setStatistics(data.summary || null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    },
  );

  const handleFilterChange = useCallback(async () => {
    setCurrentPage(1);
    await withDelayedLoading(async () => {
      try {
        const params = new URLSearchParams();
        params.append("page", "1");
        if (filterIsActive !== null) {
          params.append("IsActive", filterIsActive.toString());
        }
        if (filterUsername) {
          params.append("Username", filterUsername);
        }
        if (filterSkillIds.length > 0) {
          filterSkillIds.forEach((skillId) =>
            params.append("SkillIds", skillId.toString()),
          );
          params.append("SkillFilterMode", filterSkillMode);
        }
        const response = await fetch(`/api/admin/users?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            const mappedUsers = data.data.map((user: any) => ({
              id: user.id ?? 0,
              username: user.username ?? "",
              email: user.email ?? "",
              isActive: user.isActive ?? true,
              createdAt: user.createdAt ?? new Date().toISOString(),
              skills: user.skills ?? [],
            }));
            setUsers(mappedUsers);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
            setStatistics(data.summary || null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    })();
  }, [
    filterIsActive,
    filterUsername,
    filterSkillIds,
    filterSkillMode,
    withDelayedLoading,
  ]);

  const handleUsernameChange = async (value: string) => {
    setFilterUsername(value);
    await usernameValidation.validate(value);
  };

  const handleSearch = async () => {
    const result = await usernameValidation.validate(filterUsername);
    if (result.success) {
      handleFilterChange();
    }
  };

  const toggleSkillFilter = (skillId: number) => {
    setFilterSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId],
    );
  };

  const handleReset = () => {
    setFilterUsername("");
    setFilterIsActive(true);
    setFilterSkillIds([]);
    setFilterSkillMode("and");
    usernameValidation.clearErrors();
    setCurrentPage(1);
    // リセット後、初期フィルター条件で検索実行
    handleFilterChange();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LoadingOverlay
        isLoading={isLoading || showLoading}
        message={isLoading ? "初期化中..." : "検索中..."}
      />

      {/* Sticky Navigation Header */}
      <AdminHeader
        userInfo={userInfo}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={isLoading}
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">ユーザー管理</h1>
              <button type="button" className="btn btn-primary">
                新規ユーザー作成
              </button>
            </div>

            {/* Error Message */}
            {fetchError && (
              <div className="alert alert-error mb-6">
                <span>{fetchError}</span>
              </div>
            )}

            {/* Filter Section */}
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <div
                  className="flex items-center justify-between cursor-pointer py-2"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <div className="flex items-center gap-2">
                    <FilterListIcon />
                    <span
                      className={`text-lg font-semibold underline decoration-dashed underline-offset-4 hover:decoration-solid transition-colors ${filterIsActive !== true || filterUsername || (filterSkillIds && filterSkillIds.length > 0) ? "text-success" : ""}`}
                    >
                      フィルター
                    </span>
                  </div>
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    )}
                  </svg>
                </div>

                {filterOpen && (
                  <div className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Username Filter */}
                      <div className="form-control">
                        <label htmlFor="filter-username" className="label">
                          <span className="label-text">ユーザー名</span>
                        </label>
                        <input
                          type="text"
                          id="filter-username"
                          className={`input input-bordered w-full ${usernameValidation.hasErrors ? "input-error" : ""}`}
                          placeholder="前方一致検索..."
                          value={filterUsername}
                          onChange={(e) => handleUsernameChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              usernameValidation.isValid
                            ) {
                              handleSearch();
                            }
                          }}
                        />
                        {usernameValidation.error && (
                          <label className="label">
                            <span className="label-text-alt text-error">
                              {usernameValidation.error}
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Status Filter */}
                      <div className="form-control md:col-span-2">
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
                              onChange={() => {
                                setFilterIsActive(true);
                              }}
                            />
                            <span className="text-sm">アクティブのみ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              className="radio radio-sm"
                              checked={filterIsActive === false}
                              onChange={() => {
                                setFilterIsActive(false);
                              }}
                            />
                            <span className="text-sm">非アクティブのみ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              className="radio radio-sm"
                              checked={filterIsActive === null}
                              onChange={() => {
                                setFilterIsActive(null);
                              }}
                            />
                            <span className="text-sm">すべて</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Skill Filter */}
                    {skills.length > 0 && (
                      <div className="mb-4">
                        <label className="label">
                          <span className="label-text">スキル</span>
                        </label>
                        <details className="dropdown w-full">
                          <summary className="btn btn-outline w-full justify-start">
                            {filterSkillIds.length > 0
                              ? `${filterSkillIds.length} 個選択中`
                              : "スキルを選択"}
                          </summary>
                          <ul className="dropdown-content menu bg-base-100 rounded-box w-full p-2 shadow-lg border border-base-300 max-h-60 overflow-y-auto z-[1]">
                            {skills.map((skill) => (
                              <li key={skill.id}>
                                <label className="label cursor-pointer gap-3 hover:bg-base-200 rounded p-2">
                                  <input
                                    type="checkbox"
                                    checked={filterSkillIds.includes(skill.id)}
                                    onChange={() => toggleSkillFilter(skill.id)}
                                    className="checkbox checkbox-primary checkbox-sm"
                                  />
                                  <span className="label-text">
                                    {skill.name}
                                  </span>
                                </label>
                              </li>
                            ))}
                          </ul>
                        </details>
                        {filterSkillIds.length > 0 && (
                          <>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {filterSkillIds.map((skillId) => {
                                const skill = skills.find(
                                  (s) => s.id === skillId,
                                );
                                return (
                                  <div
                                    key={skillId}
                                    className="badge badge-primary gap-2"
                                  >
                                    {skill?.name}
                                    <button
                                      type="button"
                                      onClick={() => toggleSkillFilter(skillId)}
                                      className="btn btn-ghost btn-xs no-animation"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Skill Filter Mode */}
                            <div className="flex gap-4 mt-3">
                              <label className="flex items-center cursor-pointer gap-2">
                                <input
                                  type="radio"
                                  name="skillFilterMode"
                                  value="and"
                                  checked={filterSkillMode === "and"}
                                  onChange={(e) =>
                                    setFilterSkillMode(
                                      e.target.value as "and" | "or",
                                    )
                                  }
                                  className="radio radio-primary radio-sm"
                                />
                                <span className="text-sm">
                                  すべてのスキルを保有
                                </span>
                              </label>
                              <label className="flex items-center cursor-pointer gap-2">
                                <input
                                  type="radio"
                                  name="skillFilterMode"
                                  value="or"
                                  checked={filterSkillMode === "or"}
                                  onChange={(e) =>
                                    setFilterSkillMode(
                                      e.target.value as "and" | "or",
                                    )
                                  }
                                  className="radio radio-primary radio-sm"
                                />
                                <span className="text-sm">
                                  いずれかのスキルを保有
                                </span>
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={!usernameValidation.isValid}
                        className="btn btn-primary btn-sm"
                      >
                        検索
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-outline btn-sm"
                      >
                        リセット
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User List */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">ユーザー一覧</h2>
                <p className="text-sm text-base-content opacity-70 mb-4">
                  合計: {totalCount} 件 (ページ {currentPage}/{totalPages})
                </p>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>ユーザー名</th>
                        <th>メールアドレス</th>
                        <th>スキル</th>
                        <th>ステータス</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="font-bold">{user.username}</td>
                            <td>{user.email}</td>
                            <td>
                              {user.skills && user.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {user.skills.slice(0, 4).map((skill) => (
                                    <span
                                      key={skill.id}
                                      className="badge badge-sm badge-outline"
                                    >
                                      {skill.name}
                                    </span>
                                  ))}
                                  {user.skills.length > 4 && (
                                    <span className="badge badge-sm badge-outline">
                                      ...
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-base-content opacity-50">
                                  なし
                                </span>
                              )}
                            </td>
                            <td>
                              <div
                                className={`badge ${user.isActive ? "badge-success" : "badge-neutral"}`}
                              >
                                {user.isActive ? "アクティブ" : "非アクティブ"}
                              </div>
                            </td>
                            <td>
                              {new Date(user.createdAt).toLocaleDateString(
                                "ja-JP",
                              )}
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline"
                                  onClick={() =>
                                    router.push(`/admin/users/edit/${user.id}`)
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
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center text-base-content opacity-70 py-8"
                          >
                            ユーザーデータがありません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}

                {/* Statistics Section */}
                {statistics && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Skill Summary */}
                    {statistics.skillCounts &&
                      statistics.skillCounts.length > 0 && (
                        <div className="card bg-base-100 border border-base-300">
                          <div className="card-body">
                            <h3 className="card-title text-lg">スキル別</h3>
                            <div className="space-y-2">
                              {/* 件数の多い順にソートして上位5件を表示 */}
                              {[...statistics.skillCounts]
                                .sort((a, b) => b.count - a.count)
                                .slice(0, 5)
                                .map((skill) => (
                                  <div
                                    key={skill.id}
                                    className="flex justify-between items-center"
                                  >
                                    <span className="text-sm">
                                      {skill.name}
                                    </span>
                                    <span className="badge badge-primary">
                                      {skill.count}
                                    </span>
                                  </div>
                                ))}
                              {/* その他：上位5件以外の合計 */}
                              {statistics.skillCounts.length > 5 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">(その他)</span>
                                  <span className="badge badge-primary">
                                    {[...statistics.skillCounts]
                                      .sort((a, b) => b.count - a.count)
                                      .slice(5)
                                      .reduce(
                                        (sum, skill) => sum + skill.count,
                                        0,
                                      )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Role Summary */}
                    {statistics.roleCounts &&
                      statistics.roleCounts.length > 0 && (
                        <div className="card bg-base-100 border border-base-300">
                          <div className="card-body">
                            <h3 className="card-title text-lg">ロール別</h3>
                            <div className="space-y-2">
                              {statistics.roleCounts.map((role) => (
                                <div
                                  key={role.id}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-sm">{role.name}</span>
                                  <span className="badge badge-primary">
                                    {role.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Active Status */}
                    <div className="card bg-base-100 border border-base-300">
                      <div className="card-body">
                        <h3 className="card-title text-lg">ステータス</h3>
                        <div className="space-y-2">
                          {statistics.activeUserCount !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">アクティブ</span>
                              <span className="badge badge-success">
                                {statistics.activeUserCount}
                              </span>
                            </div>
                          )}
                          {statistics.inactiveUserCount !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">非アクティブ</span>
                              <span className="badge badge-neutral">
                                {statistics.inactiveUserCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Workspace Participation */}
                    <div className="card bg-base-100 border border-base-300">
                      <div className="card-body">
                        <h3 className="card-title text-lg">ワークスペース</h3>
                        <div className="space-y-2">
                          {statistics.workspaceParticipationCount !==
                            undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">参加者</span>
                              <span className="badge badge-info">
                                {statistics.workspaceParticipationCount}
                              </span>
                            </div>
                          )}
                          {statistics.noWorkspaceParticipationCount !==
                            undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">非参加者</span>
                              <span className="badge badge-warning">
                                {statistics.noWorkspaceParticipationCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <AdminFooter />
    </div>
  );
}
