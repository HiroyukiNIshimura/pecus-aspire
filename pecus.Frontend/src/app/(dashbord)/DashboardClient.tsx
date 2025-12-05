'use client';

import { useState } from 'react';
import AppHeader from '@/components/common/AppHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import type { UserInfo } from '@/types/userInfo';

interface DashboardClientProps {
  initialUser?: UserInfo | null;
  fetchError?: string | null;
}

export default function DashboardClient({ initialUser }: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader userInfo={userInfo} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <DashboardSidebar sidebarOpen={sidebarOpen} isAdmin={userInfo?.isAdmin ?? false} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 bg-base-100">
          <div className="max-w-7xl mx-auto">
            {/* ページヘッダー */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="icon-[mdi--view-dashboard-outline] text-primary w-8 h-8" aria-hidden="true" />
                <div>
                  <h1 className="text-2xl font-bold">ダッシュボード</h1>
                  <p className="text-base-content/70 mt-1">プロジェクトの概要と統計情報</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dashboard Cards */}
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">ワークスペース</h2>
                  <p>現在のワークスペース状況</p>
                  <div className="stat">
                    <div className="stat-value">12</div>
                    <div className="stat-desc">アクティブ</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">タスク</h2>
                  <p>進行中のタスク</p>
                  <div className="stat">
                    <div className="stat-value">24</div>
                    <div className="stat-desc">未完了</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">チーム</h2>
                  <p>チームメンバー</p>
                  <div className="stat">
                    <div className="stat-value">8</div>
                    <div className="stat-desc">メンバー</div>
                  </div>
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
