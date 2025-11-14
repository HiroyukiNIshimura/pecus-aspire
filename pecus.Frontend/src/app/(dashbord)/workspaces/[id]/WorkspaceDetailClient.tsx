"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AppHeader from "@/components/common/AppHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type { UserInfo } from "@/types/userInfo";

interface WorkspaceDetailClientProps {
  workspaceId: string;
  userInfo: UserInfo | null;
}

export default function WorkspaceDetailClient({
  workspaceId,
  userInfo,
}: WorkspaceDetailClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isAdmin={userInfo?.isAdmin || false}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userInfo={userInfo}
        />
        <main className="flex-1 overflow-y-auto bg-base-100 p-4 md:p-6">
          {/* ヘッダー */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="btn btn-ghost btn-sm mb-4"
              type="button"
            >
              <ArrowBackIcon className="w-5 h-5" />
              戻る
            </button>
            <h1 className="text-3xl font-bold">ワークスペース詳細</h1>
            <p className="text-base-content/70 mt-2">ID: {workspaceId}</p>
          </div>

          {/* ひな型コンテンツ */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="alert alert-info">
                <span>
                  このページはひな型です。詳細情報をここに追加予定です。
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
