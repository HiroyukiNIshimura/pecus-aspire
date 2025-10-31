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
  category: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  userCount: number;
  createdAt: string;
}

interface AdminSkillsClientProps {
  initialUser?: UserInfo | null;
  fetchError?: string | null;
}

export default function AdminSkillsClient({ initialUser, fetchError }: AdminSkillsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);

  // スタブデータ
  const skills: Skill[] = [
    {
      id: 1,
      name: 'JavaScript',
      category: 'プログラミング言語',
      description: 'Web開発の主要言語',
      level: 'intermediate',
      userCount: 15,
      createdAt: '2025-01-01'
    },
    {
      id: 2,
      name: 'Python',
      category: 'プログラミング言語',
      description: 'データ分析とAI開発に適した言語',
      level: 'advanced',
      userCount: 12,
      createdAt: '2025-01-01'
    },
    {
      id: 3,
      name: 'React',
      category: 'フレームワーク',
      description: '人気のJavaScriptライブラリ',
      level: 'intermediate',
      userCount: 18,
      createdAt: '2025-01-05'
    },
    {
      id: 4,
      name: 'UI/UXデザイン',
      category: 'デザイン',
      description: 'ユーザーインターフェースとユーザー体験の設計',
      level: 'expert',
      userCount: 8,
      createdAt: '2025-01-10'
    },
    {
      id: 5,
      name: 'プロジェクトマネジメント',
      category: 'マネジメント',
      description: 'プロジェクトの計画と実行管理',
      level: 'advanced',
      userCount: 6,
      createdAt: '2025-01-15'
    }
  ];

  const categories = [...new Set(skills.map(skill => skill.category))];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'badge-info';
      case 'intermediate': return 'badge-warning';
      case 'advanced': return 'badge-error';
      case 'expert': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return '初級';
      case 'intermediate': return '中級';
      case 'advanced': return '上級';
      case 'expert': return 'エキスパート';
      default: return level;
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
              <h1 className="text-3xl font-bold">スキル管理</h1>
              <button className="btn btn-primary">新規スキル追加</button>
            </div>

            {/* Skill Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">総スキル数</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl">{skills.length}</div>
                    <div className="stat-desc">登録済み</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">カテゴリ数</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-info">{categories.length}</div>
                    <div className="stat-desc">分類</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">総保有者数</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-success">
                      {skills.reduce((sum, skill) => sum + skill.userCount, 0)}
                    </div>
                    <div className="stat-desc">スキル保有者</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">平均レベル</h2>
                  <div className="stat">
                    <div className="stat-value text-3xl text-warning">
                      {Math.round(skills.reduce((sum, skill) => {
                        const levelValue = skill.level === 'beginner' ? 1 :
                                          skill.level === 'intermediate' ? 2 :
                                          skill.level === 'advanced' ? 3 : 4;
                        return sum + levelValue;
                      }, 0) / skills.length * 10) / 10}
                    </div>
                    <div className="stat-desc">レベル値</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Categories */}
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <h2 className="card-title mb-4">スキルカテゴリ</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <div key={category} className="badge badge-lg badge-outline">
                      {category} ({skills.filter(s => s.category === category).length})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill List */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">スキル一覧</h2>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>スキル名</th>
                        <th>カテゴリ</th>
                        <th>レベル</th>
                        <th>保有者数</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skills.map((skill) => (
                        <tr key={skill.id}>
                          <td>{skill.id}</td>
                          <td>
                            <div>
                              <div className="font-bold">{skill.name}</div>
                              {skill.description && (
                                <div className="text-sm opacity-70">{skill.description}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="badge badge-outline">{skill.category}</div>
                          </td>
                          <td>
                            <div className={`badge ${getLevelColor(skill.level)}`}>
                              {getLevelText(skill.level)}
                            </div>
                          </td>
                          <td>{skill.userCount}人</td>
                          <td>{skill.createdAt}</td>
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
