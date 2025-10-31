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

interface Skill {
  id: number;
  name: string;
  description?: string;
  userCount: number;
  createdAt: string;
  isActive: boolean;
}

interface AdminSkillsClientProps {
  initialUser?: UserInfo | null;
  initialSkills?: any[] | null;
  fetchError?: string | null;
}

export default function AdminSkillsClient({ initialUser, initialSkills, fetchError }: AdminSkillsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);

  // 初期スキルデータをPropsから取得
  const skills: Skill[] = (initialSkills ?? []).map((skill: any) => ({
    id: skill.id || 0,
    name: skill.name || '',
    description: skill.description || undefined,
    userCount: skill.userCount || 0,
    createdAt: skill.createdAt || new Date().toISOString(),
    isActive: skill.isActive !== undefined ? skill.isActive : true,
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
              <h1 className="text-3xl font-bold">スキル管理</h1>
              <button className="btn btn-primary">新規スキル追加</button>
            </div>

            {/* Skill List */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">スキル一覧</h2>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>スキル名</th>
                        <th>説明</th>
                        <th>保有者数</th>
                        <th>ステータス</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skills.map((skill) => (
                        <tr key={skill.id}>
                          <td className="font-bold">{skill.name}</td>
                          <td>{skill.description || '-'}</td>
                          <td>{skill.userCount}人</td>
                          <td>
                            {skill.isActive ? (
                              <div className="badge badge-success">
                                アクティブ
                              </div>
                            ) : (
                              <div className="badge badge-outline">
                                非アクティブ
                              </div>
                            )}
                          </td>
                          <td>{formatDate(skill.createdAt)}</td>
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
