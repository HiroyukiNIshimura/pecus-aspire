"use client";

import { useState, useEffect } from "react";
import { WorkspaceListItemResponse, WorkspaceListItemResponseWorkspaceStatisticsPagedResponse, WorkspaceStatistics } from '@/connectors/api/pecus';
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFooter from "@/components/admin/AdminFooter";
import Pagination from "@/components/common/Pagination";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface AdminWorkspacesClientProps {
  initialWorkspaces?: WorkspaceListItemResponse[];
  initialTotalCount?: number;
  initialTotalPages?: number;
  initialUser?: UserInfo | null;
  initialStatistics?: WorkspaceStatistics | null;
  fetchError?: string | null;
}

export default function AdminWorkspacesClient({ initialWorkspaces, initialTotalCount, initialTotalPages, initialUser, initialStatistics, fetchError }: AdminWorkspacesClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(initialUser || null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItemResponse[]>(initialWorkspaces || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
  const [statistics, setStatistics] = useState<WorkspaceStatistics | null>(initialStatistics || null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchInitialData = async () => {
      if (!initialWorkspaces || initialWorkspaces.length === 0) {
        try {
          const response = await fetch('/api/admin/workspaces?page=1&activeOnly=true');
          if (response.ok) {
            const data: WorkspaceListItemResponseWorkspaceStatisticsPagedResponse = await response.json();
            setWorkspaces(data.data || []);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
            setStatistics(data.summary || null);
          }
        } catch (error) {
          console.error('Failed to fetch initial workspaces:', error);
        }
      }
    };

    fetchUserInfo();
    fetchInitialData();
  }, [initialWorkspaces]);

  const handlePageChange = async ({ selected }: { selected: number }) => {
    try {
      const page = selected + 1; // react-paginateは0-based
      const response = await fetch(`/api/admin/workspaces?page=${page}&activeOnly=true`);
      if (response.ok) {
        const data: WorkspaceListItemResponseWorkspaceStatisticsPagedResponse = await response.json();
        setWorkspaces(data.data || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setStatistics(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-base-100 bg-opacity-80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-lg">読み込み中...</p>
          </div>
        </div>
      )}

      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={userInfo} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={loading} />

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
              <h1 className="text-3xl font-bold">ワークスペース管理</h1>
              <button className="btn btn-primary">新規作成</button>
            </div>

            {/* Workspace Stats */}
            {(() => {
              const stats = statistics || {
                activeWorkspaceCount: 0,
                inactiveWorkspaceCount: 0,
                totalWorkspaceCount: 0,
                uniqueMemberCount: 0,
                averageMembersPerWorkspace: 0,
                recentWorkspaceCount: 0
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Total Workspaces */}
                  <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="card-title text-lg">総ワークスペース数</h3>
                        <span className="badge badge-primary">全体</span>
                      </div>
                      <div className="text-4xl font-bold text-primary mb-2">
                        {stats.totalWorkspaceCount}
                      </div>
                      <div className="text-sm text-base-content opacity-70">
                        登録済みワークスペース
                      </div>
                    </div>
                  </div>

                  {/* Active Workspaces */}
                  <div className="card bg-base-100 shadow-xl border border-success border-opacity-30">
                    <div className="card-body p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="card-title text-lg">アクティブ</h3>
                        <span className="badge badge-success">稼働中</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-4xl font-bold text-success">
                          {stats.activeWorkspaceCount}
                        </div>
                        <span className="text-sm text-base-content opacity-70">
                          / {stats.totalWorkspaceCount}
                        </span>
                      </div>
                      <div className="text-sm text-base-content opacity-70">
                        {(stats.totalWorkspaceCount ?? 0) > 0
                          ? `${Math.round(((stats.activeWorkspaceCount ?? 0) / (stats.totalWorkspaceCount ?? 1)) * 100)}% が稼働中`
                          : '稼働中のワークスペースなし'}
                      </div>
                    </div>
                  </div>

                  {/* Inactive Workspaces */}
                  <div className="card bg-base-100 shadow-xl border border-warning border-opacity-30">
                    <div className="card-body p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="card-title text-lg">非アクティブ</h3>
                        <span className="badge badge-warning">停止中</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <div className="text-4xl font-bold text-warning">
                          {stats.inactiveWorkspaceCount}
                        </div>
                        <span className="text-sm text-base-content opacity-70">
                          / {stats.totalWorkspaceCount}
                        </span>
                      </div>
                      <div className="text-sm text-base-content opacity-70">
                        {(stats.totalWorkspaceCount ?? 0) > 0
                          ? `${Math.round(((stats.inactiveWorkspaceCount ?? 0) / (stats.totalWorkspaceCount ?? 1)) * 100)}% が停止中`
                          : '非アクティブなワークスペースなし'}
                      </div>
                    </div>
                  </div>

                  {/* Unique Members */}
                  <div className="card bg-base-100 shadow-xl border border-info border-opacity-30">
                    <div className="card-body p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="card-title text-lg">総メンバー数</h3>
                        <span className="badge badge-info">ユニーク</span>
                      </div>
                      <div className="text-4xl font-bold text-info mb-2">
                        {stats.uniqueMemberCount}
                      </div>
                      <div className="text-sm text-base-content opacity-70">
                        参加者（重複なし）
                      </div>
                    </div>
                  </div>

                  {/* Average Members */}
                  <div className="card bg-base-100 shadow-xl border border-secondary border-opacity-30">
                    <div className="card-body p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="card-title text-lg">平均メンバー数</h3>
                        <span className="badge badge-secondary">統計</span>
                      </div>
                      <div className="text-4xl font-bold text-secondary mb-2">
                        {(stats.averageMembersPerWorkspace || 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-base-content opacity-70">
                        ワークスペースあたり
                      </div>
                    </div>
                  </div>

                  {/* Recent Workspaces */}
                  <div className="card bg-base-100 shadow-xl border border-accent border-opacity-30">
                    <div className="card-body p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="card-title text-lg">最近作成</h3>
                        <span className="badge badge-accent">30日以内</span>
                      </div>
                      <div className="text-4xl font-bold text-accent mb-2">
                        {stats.recentWorkspaceCount}
                      </div>
                      <div className="text-sm text-base-content opacity-70">
                        過去30日間に作成
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Workspace List */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">ワークスペース一覧</h2>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>ワークスペース名</th>
                        <th>組織</th>
                        <th>ステータス</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workspaces.map((workspace) => (
                        <tr key={workspace.id}>
                          <td>{workspace.id}</td>
                          <td>
                            <div>
                              <div className="font-bold">{workspace.name}</div>
                              {workspace.description && (
                                <div className="text-sm opacity-70">{workspace.description}</div>
                              )}
                            </div>
                          </td>
                          <td>{workspace.organizationName || '不明'}</td>
                          <td>
                            <div className={`badge ${workspace.isActive ? 'badge-success' : 'badge-neutral'}`}>
                              {workspace.isActive ? 'アクティブ' : '非アクティブ'}
                            </div>
                          </td>
                          <td>{workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString('ja-JP') : '不明'}</td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn btn-sm btn-outline">編集</button>
                              <button className="btn btn-sm btn-outline btn-error">削除</button>
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
          </div>
        </main>
      </div>

      {/* Footer */}
      <AdminFooter />
    </div>
  );
}