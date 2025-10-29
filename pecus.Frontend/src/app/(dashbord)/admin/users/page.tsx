"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFooter from "@/components/admin/AdminFooter";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // スタブデータ
  const users: User[] = [
    {
      id: 1,
      name: '管理者ユーザー',
      email: 'admin@example.com',
      roles: ['Admin'],
      status: 'active',
      lastLogin: '2025-01-28 10:30',
      createdAt: '2025-01-01'
    },
    {
      id: 2,
      name: 'テストユーザー',
      email: 'user@example.com',
      roles: ['User'],
      status: 'active',
      lastLogin: '2025-01-27 15:45',
      createdAt: '2025-01-15'
    },
    {
      id: 3,
      name: '開発者',
      email: 'dev@example.com',
      roles: ['User'],
      status: 'active',
      lastLogin: '2025-01-28 09:15',
      createdAt: '2025-01-10'
    },
    {
      id: 4,
      name: 'ゲスト',
      email: 'guest@example.com',
      roles: ['User'],
      status: 'inactive',
      createdAt: '2025-01-20'
    }
  ];

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

    fetchUserInfo();
  }, []);

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
              <h1 className="text-3xl font-bold">ユーザー管理</h1>
              <button className="btn btn-primary">新規ユーザー作成</button>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">総ユーザー数</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl">{users.length}</div>
                    <div className="stat-desc">登録済み</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">アクティブ</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-success">
                      {users.filter(u => u.status === 'active').length}
                    </div>
                    <div className="stat-desc">有効</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">管理者</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-warning">
                      {users.filter(u => u.roles.includes('Admin')).length}
                    </div>
                    <div className="stat-desc">権限保有者</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">新規登録</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-info">
                      {users.filter(u => new Date(u.createdAt) > new Date('2025-01-20')).length}
                    </div>
                    <div className="stat-desc">今月</div>
                  </div>
                </div>
              </div>
            </div>

            {/* User List */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">ユーザー一覧</h2>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>名前</th>
                        <th>メールアドレス</th>
                        <th>ロール</th>
                        <th>ステータス</th>
                        <th>最終ログイン</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td className="font-bold">{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <div className="flex gap-1 flex-wrap">
                              {user.roles.map((role, index) => (
                                <div key={index} className={`badge ${role === 'Admin' ? 'badge-warning' : 'badge-neutral'}`}>
                                  {role}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                              {user.status === 'active' ? 'アクティブ' : '非アクティブ'}
                            </div>
                          </td>
                          <td>{user.lastLogin || '-'}</td>
                          <td>{user.createdAt}</td>
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