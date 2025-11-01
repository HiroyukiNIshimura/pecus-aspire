"use client";

import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFooter from "@/components/admin/AdminFooter";
import Pagination from "@/components/common/Pagination";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  skills?: Array<{ id: number; name: string }>;
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
  fetchError?: string | null;
}

export default function AdminUsersClient({
  initialUsers,
  initialTotalCount,
  initialTotalPages,
  initialUser,
  initialStatistics,
  fetchError
}: AdminUsersClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
  const [statistics, setStatistics] = useState<UserStatistics | null>(initialStatistics || null);
  const [isLoading, setIsLoading] = useState(true);

  const { showLoading, withDelayedLoading } = useDelayedLoading();

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!initialUsers || initialUsers.length === 0) {
        try {
          const response = await fetch('/api/admin/users?page=1&IsActive=true');
          if (response.ok) {
            const data = await response.json();
            if (data && data.data) {
              const mappedUsers = data.data.map((user: any) => ({
                id: user.id ?? 0,
                username: user.username ?? '',
                email: user.email ?? '',
                isActive: true, // APIレスポンスに isActive がないため、デフォルト true
                createdAt: user.createdAt ?? new Date().toISOString(),
                skills: user.skills ?? [], // ユーザーのスキル一覧
              }));
              console.log('Initial Users Response:', mappedUsers);
              setUsers(mappedUsers);
              setCurrentPage(data.currentPage || 1);
              setTotalPages(data.totalPages || 1);
              setTotalCount(data.totalCount || 0);
              setStatistics(data.summary || null);
            }
          }
        } catch (error) {
          console.error('Failed to fetch initial users:', error);
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
        const response = await fetch(`/api/admin/users?page=${page}&IsActive=true`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            const mappedUsers = data.data.map((user: any) => ({
              id: user.id ?? 0,
              username: user.username ?? '',
              email: user.email ?? '',
              isActive: true, // APIレスポンスに isActive がないため、デフォルト true
              createdAt: user.createdAt ?? new Date().toISOString(),
              skills: user.skills ?? [], // ユーザーのスキル一覧
            }));
            console.log('API Response:', mappedUsers);
            setUsers(mappedUsers);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
            setStatistics(data.summary || null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Loading Overlay */}
      {(isLoading || showLoading) && (
        <div className="fixed inset-0 bg-base-100 bg-opacity-80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-lg">{isLoading ? '初期化中...' : '検索中...'}</p>
          </div>
        </div>
      )}

      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={userInfo} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={isLoading} />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 bg-base-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">ユーザー管理</h1>
              <button className="btn btn-primary">新規ユーザー作成</button>
            </div>

            {/* Error Message */}
            {fetchError && (
              <div className="alert alert-error mb-6">
                <span>{fetchError}</span>
              </div>
            )}

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
                                    <span key={skill.id} className="badge badge-sm badge-outline">
                                      {skill.name}
                                    </span>
                                  ))}
                                  {user.skills.length > 4 && (
                                    <span className="badge badge-sm badge-outline">...</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-base-content opacity-50">なし</span>
                              )}
                            </td>
                            <td>
                              <div className={`badge ${user.isActive ? 'badge-success' : 'badge-neutral'}`}>
                                {user.isActive ? 'アクティブ' : '非アクティブ'}
                              </div>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString('ja-JP')}</td>
                            <td>
                              <div className="flex gap-2">
                                <button className="btn btn-sm btn-outline">編集</button>
                                <button className="btn btn-sm btn-outline btn-error">削除</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-base-content opacity-70 py-8">
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
                    {statistics.skillCounts && statistics.skillCounts.length > 0 && (
                      <div className="card bg-base-100 border border-base-300">
                        <div className="card-body">
                          <h3 className="card-title text-lg">スキル別</h3>
                          <div className="space-y-2">
                            {/* 件数の多い順にソートして上位5件を表示 */}
                            {[...statistics.skillCounts]
                              .sort((a, b) => b.count - a.count)
                              .slice(0, 5)
                              .map((skill) => (
                                <div key={skill.id} className="flex justify-between items-center">
                                  <span className="text-sm">{skill.name}</span>
                                  <span className="badge badge-primary">{skill.count}</span>
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
                                    .reduce((sum, skill) => sum + skill.count, 0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Role Summary */}
                    {statistics.roleCounts && statistics.roleCounts.length > 0 && (
                      <div className="card bg-base-100 border border-base-300">
                        <div className="card-body">
                          <h3 className="card-title text-lg">ロール別</h3>
                          <div className="space-y-2">
                            {statistics.roleCounts.map((role) => (
                              <div key={role.id} className="flex justify-between items-center">
                                <span className="text-sm">{role.name}</span>
                                <span className="badge badge-primary">{role.count}</span>
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
                              <span className="badge badge-success">{statistics.activeUserCount}</span>
                            </div>
                          )}
                          {statistics.inactiveUserCount !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">非アクティブ</span>
                              <span className="badge badge-neutral">{statistics.inactiveUserCount}</span>
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
                          {statistics.workspaceParticipationCount !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">参加者</span>
                              <span className="badge badge-info">{statistics.workspaceParticipationCount}</span>
                            </div>
                          )}
                          {statistics.noWorkspaceParticipationCount !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">非参加者</span>
                              <span className="badge badge-warning">{statistics.noWorkspaceParticipationCount}</span>
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
