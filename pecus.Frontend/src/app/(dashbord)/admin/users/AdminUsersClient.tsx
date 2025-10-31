"use client";

import { useState, useEffect } from "react";
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

interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminUsersClientProps {
  initialUsers?: User[];
  initialTotalCount?: number;
  initialTotalPages?: number;
  initialUser?: UserInfo | null;
  fetchError?: string | null;
}

interface UserListResponse {
  data?: User[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
}

export default function AdminUsersClient({
  initialUsers,
  initialTotalCount,
  initialTotalPages,
  initialUser,
  fetchError
}: AdminUsersClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!initialUsers || initialUsers.length === 0) {
        try {
          const response = await fetch('/api/admin/users?page=1');
          if (response.ok) {
            const data: UserListResponse = await response.json();
            setUsers(data.data || []);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
          }
        } catch (error) {
          console.error('Failed to fetch initial users:', error);
        }
      }
    };

    fetchInitialData();
  }, [initialUsers]);

  const handlePageChange = async ({ selected }: { selected: number }) => {
    try {
      const page = selected + 1;
      const response = await fetch(`/api/admin/users?page=${page}`);
      if (response.ok) {
        const data: UserListResponse = await response.json();
        setUsers(data.data || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={userInfo} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={false} />

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
                          <td colSpan={5} className="text-center text-base-content opacity-70 py-8">
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
