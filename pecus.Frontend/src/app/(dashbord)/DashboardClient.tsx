"use client";

import { useState } from "react";
import AppHeader from "@/components/common/AppHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface DashboardClientProps {
  initialUser?: UserInfo | null;
  fetchError?: string | null;
}

export default function DashboardClient({ initialUser, fetchError }: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        userInfo={userInfo}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAdminLink={false}
      />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isAdmin={userInfo?.isAdmin ?? false} />

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
            <h1 className="text-3xl font-bold mb-6">ダッシュボード</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dashboard Cards */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">ワークスペース</h2>
                  <p>現在のワークスペース状況</p>
                  <div className="stat">
                    <div className="stat-value">12</div>
                    <div className="stat-desc">アクティブ</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">タスク</h2>
                  <p>進行中のタスク</p>
                  <div className="stat">
                    <div className="stat-value">24</div>
                    <div className="stat-desc">未完了</div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
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
