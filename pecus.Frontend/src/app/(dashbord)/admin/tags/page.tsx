"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  usageCount: number;
  workspacesCount: number;
  createdAt: string;
  createdBy: string;
}

export default function AdminTags() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // スタブデータ
  const tags: Tag[] = [
    {
      id: 1,
      name: '緊急',
      color: '#ef4444',
      description: '緊急を要するタスク',
      usageCount: 25,
      workspacesCount: 5,
      createdAt: '2025-01-01',
      createdBy: '管理者ユーザー'
    },
    {
      id: 2,
      name: '重要',
      color: '#f59e0b',
      description: '重要なタスク',
      usageCount: 45,
      workspacesCount: 8,
      createdAt: '2025-01-01',
      createdBy: '管理者ユーザー'
    },
    {
      id: 3,
      name: '開発',
      color: '#10b981',
      description: '開発関連のタスク',
      usageCount: 78,
      workspacesCount: 12,
      createdAt: '2025-01-05',
      createdBy: 'テストユーザー'
    },
    {
      id: 4,
      name: 'デザイン',
      color: '#8b5cf6',
      description: 'デザイン関連のタスク',
      usageCount: 32,
      workspacesCount: 6,
      createdAt: '2025-01-10',
      createdBy: '開発者'
    },
    {
      id: 5,
      name: 'レビュー待ち',
      color: '#06b6d4',
      description: 'レビューを待っているタスク',
      usageCount: 18,
      workspacesCount: 4,
      createdAt: '2025-01-15',
      createdBy: '管理者ユーザー'
    },
    {
      id: 6,
      name: '完了',
      color: '#6b7280',
      description: '完了したタスク',
      usageCount: 156,
      workspacesCount: 15,
      createdAt: '2025-01-01',
      createdBy: '管理者ユーザー'
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
              <h1 className="text-3xl font-bold">タグ管理</h1>
              <button className="btn btn-primary">新規タグ作成</button>
            </div>

            {/* Tag Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">総タグ数</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl">{tags.length}</div>
                    <div className="stat-desc">登録済み</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">総使用回数</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-success">
                      {tags.reduce((sum, tag) => sum + tag.usageCount, 0)}
                    </div>
                    <div className="stat-desc">タスクに付与</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">使用中のワークスペース</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-info">
                      {tags.reduce((sum, tag) => sum + tag.workspacesCount, 0)}
                    </div>
                    <div className="stat-desc">ワークスペース</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">平均使用率</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-warning">
                      {Math.round(tags.reduce((sum, tag) => sum + tag.usageCount, 0) / tags.length)}
                    </div>
                    <div className="stat-desc">タグあたり</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tag Preview */}
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <h2 className="card-title mb-4">タグプレビュー</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 8).map((tag) => (
                    <div
                      key={tag.id}
                      className="badge badge-lg"
                      style={{ backgroundColor: tag.color, color: 'white' }}
                    >
                      {tag.name}
                    </div>
                  ))}
                  {tags.length > 8 && (
                    <div className="badge badge-lg badge-outline">
                      +{tags.length - 8} 個
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tag List */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">タグ一覧</h2>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>タグ名</th>
                        <th>色</th>
                        <th>使用回数</th>
                        <th>ワークスペース数</th>
                        <th>作成者</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags.map((tag) => (
                        <tr key={tag.id}>
                          <td>{tag.id}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: tag.color }}
                              ></div>
                              <div>
                                <div className="font-bold">{tag.name}</div>
                                {tag.description && (
                                  <div className="text-sm opacity-70">{tag.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: tag.color }}
                              ></div>
                              <span className="text-sm font-mono">{tag.color}</span>
                            </div>
                          </td>
                          <td>{tag.usageCount}回</td>
                          <td>{tag.workspacesCount}個</td>
                          <td>{tag.createdBy}</td>
                          <td>{tag.createdAt}</td>
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
      <footer className="bg-base-200 text-base-content p-4 text-center">
        <p>&copy; 2025 Pecus. All rights reserved.</p>
      </footer>
    </div>
  );
}