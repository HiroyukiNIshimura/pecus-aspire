"use client";

import { useEffect, useState } from "react";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: string[];
  isAdmin: boolean;
}

export default function Admin() {
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
      <AdminHeader
        userInfo={userInfo}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading}
      />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

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
            <h1 className="text-3xl font-bold mb-6">組織</h1>

            {/* Organization Information Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">デフォルト組織情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <div className="label">
                      <span className="label-text font-semibold">組織名</span>
                    </div>
                    <div className="text-lg">Pecus Corporation</div>
                  </div>

                  <div className="form-control">
                    <div className="label">
                      <span className="label-text font-semibold">組織ID</span>
                    </div>
                    <div className="text-lg">ORG-001</div>
                  </div>

                  <div className="form-control">
                    <div className="label">
                      <span className="label-text font-semibold">作成日</span>
                    </div>
                    <div className="text-lg">2025年1月1日</div>
                  </div>

                  <div className="form-control">
                    <div className="label">
                      <span className="label-text font-semibold">
                        ステータス
                      </span>
                    </div>
                    <div className={`badge badge-lg badge-success`}>
                      アクティブ
                    </div>
                  </div>
                </div>

                <div className="divider"></div>

                <div className="form-control">
                  <div className="label">
                    <span className="label-text font-semibold">説明</span>
                  </div>
                  <div className="text-base">
                    デフォルトの組織設定です。システム全体の基本設定を管理します。
                  </div>
                </div>

                <div className="card-actions justify-end mt-6">
                  <button type="button" className="btn btn-primary">
                    編集
                  </button>
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
