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
  itemCount: number;
  isActive: boolean;
  createdAt: string;
}

interface AdminTagsClientProps {
  initialUser?: UserInfo | null;
  initialTags?: any[] | null;
  fetchError?: string | null;
}

export default function AdminTagsClient({ initialUser, initialTags, fetchError }: AdminTagsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);

  // 初期タグデータをPropsから取得
  const tags: Tag[] = (initialTags ?? []).map((tag: any) => ({
    id: tag.id || 0,
    name: tag.name || '',
    itemCount: tag.itemCount || 0,
    isActive: tag.isActive !== false,
    createdAt: tag.createdAt || new Date().toISOString(),
  }));

  // 日付をYYYY/MM/DD形式にフォーマット
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
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
            {/* Error Alert */}
            {fetchError && (
              <div className="alert alert-error mb-6" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m6-6l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2" />
                </svg>
                <span>{fetchError}</span>
              </div>
            )}

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
                        <th>アイテム数</th>
                        <th>ステータス</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags.map((tag) => (
                        <tr key={tag.id}>
                          <td className="font-semibold">{tag.name}</td>
                          <td>{tag.itemCount}</td>
                          <td>
                            <div className={`badge ${tag.isActive ? 'badge-success' : 'badge-neutral'}`}>
                              {tag.isActive ? 'アクティブ' : 'インアクティブ'}
                            </div>
                          </td>
                          <td>{formatDate(tag.createdAt)}</td>
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
