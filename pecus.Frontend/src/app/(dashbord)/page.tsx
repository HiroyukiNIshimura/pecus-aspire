"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: string[];
  isAdmin: boolean;
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
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
      <header className="sticky top-0 z-10 bg-base-100 shadow-sm border-b border-base-300">
        <nav className="navbar">
          <div className="navbar-start flex flex-col">
            <a href="/" className="text-3xl font-bold">
              Pecus
            </a>
            <div className="md:hidden mt-2">
              <button
                type="button"
                className="p-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <span className="icon-[tabler--menu-2] size-5"></span>
              </button>
            </div>
          </div>
          <div className="navbar-center hidden md:flex">
            <ul className="menu menu-horizontal px-1">
              <li>
                <a href="/">ダッシュボード</a>
              </li>
              <li>
                <a href="/workspaces">ワークスペース</a>
              </li>
              <li className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-start]">
                <button type="button" className="dropdown-toggle">
                  機能
                  <span className="icon-[tabler--chevron-down] dropdown-open:rotate-180 size-4"></span>
                </button>
                <ul className="dropdown-menu dropdown-open:opacity-100 hidden">
                  <li>
                    <a className="dropdown-item" href="/tasks">
                      タスク管理
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/calendar">
                      カレンダー
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="/reports">
                      レポート
                    </a>
                  </li>
                </ul>
              </li>
              {userInfo?.isAdmin && (
                <li>
                  <a href="/admin">管理者</a>
                </li>
              )}
            </ul>
          </div>
          <div className="navbar-end">
            <div className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-end]">
              <button
                type="button"
                className="dropdown-toggle btn btn-ghost btn-circle avatar"
              >
                <div className="w-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
                  U
                </div>
              </button>
              <ul className="dropdown-menu dropdown-open:opacity-100 hidden">
                <li>
                  <a className="dropdown-item" href="/profile">
                    プロフィール
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/settings">
                    設定
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item w-full text-left"
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/signin";
                    }}
                  >
                    ログアウト
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

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
