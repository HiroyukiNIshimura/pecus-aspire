"use client";

import { useState } from "react";
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

interface AdminTagsClientProps {
  initialUser?: UserInfo | null;
  fetchError?: string | null;
}

export default function AdminTagsClient({ initialUser, fetchError }: AdminTagsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);

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
              <h1 className="text-3xl font-bold">タグ管理</h1>
              <button className="btn btn-primary">新規作成</button>
            </div>

            {/* Tags Table */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>タグ名</th>
                        <th>カラー</th>
                        <th>説明</th>
                        <th>使用数</th>
                        <th>ワークスペース数</th>
                        <th>作成日</th>
                        <th>作成者</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags.map((tag) => (
                        <tr key={tag.id}>
                          <td className="font-semibold">{tag.name}</td>
                          <td>
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: tag.color }}
                            ></div>
                          </td>
                          <td>{tag.description || '-'}</td>
                          <td className="text-center">{tag.usageCount}</td>
                          <td className="text-center">{tag.workspacesCount}</td>
                          <td>{new Date(tag.createdAt).toLocaleDateString('ja-JP')}</td>
                          <td>{tag.createdBy}</td>
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
