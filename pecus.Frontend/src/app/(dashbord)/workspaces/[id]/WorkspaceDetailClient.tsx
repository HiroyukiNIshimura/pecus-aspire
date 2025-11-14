"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PersonIcon from "@mui/icons-material/Person";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import PowerOffIcon from "@mui/icons-material/PowerOff";
import AppHeader from "@/components/common/AppHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type { UserInfo } from "@/types/userInfo";
import type { WorkspaceFullDetailResponse } from "@/connectors/api/pecus";

interface WorkspaceDetailClientProps {
  workspaceId: string;
  workspaceDetail: WorkspaceFullDetailResponse;
  userInfo: UserInfo | null;
}

export default function WorkspaceDetailClient({
  workspaceId,
  workspaceDetail,
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
          {/* ワークスペース詳細情報 */}
          <div className="card bg-base-100 shadow-md mb-6">
            <div className="card-body">
              {/* ヘッダー */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold truncate">
                    {workspaceDetail.name}
                  </h2>
                  {workspaceDetail.code && (
                    <code className="text-sm badge badge-ghost badge-md mt-2 truncate max-w-full block">
                      {workspaceDetail.code}
                    </code>
                  )}
                </div>
              </div>

              {/* 説明 */}
              {workspaceDetail.description && (
                <p className="text-base text-base-content/70 mb-4 whitespace-pre-wrap break-words">
                  {workspaceDetail.description}
                </p>
              )}

              {/* メタ情報（4列） */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 py-4 border-y border-base-300 text-sm">
                {/* ステータス */}
                <div>
                  <span className="text-xs text-base-content/70">ステータス</span>
                  <p className="font-semibold">
                    {workspaceDetail.isActive ? "アクティブ" : "非アクティブ"}
                  </p>
                </div>

                {/* 作成日時 */}
                {workspaceDetail.createdAt && (
                  <div>
                    <span className="text-xs text-base-content/70">作成日時</span>
                    <p className="font-semibold">
                      {new Date(workspaceDetail.createdAt).toLocaleString(
                        "ja-JP"
                      )}
                    </p>
                  </div>
                )}

                {/* 作成者 */}
                {workspaceDetail.createdBy?.userName && (
                  <div>
                    <span className="text-xs text-base-content/70">作成者</span>
                    <div className="flex items-center gap-2 mt-1">
                      {workspaceDetail.createdBy.identityIconUrl && (
                        <img
                          src={workspaceDetail.createdBy.identityIconUrl}
                          alt={workspaceDetail.createdBy.userName}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <p className="font-semibold truncate">
                        {workspaceDetail.createdBy.userName}
                      </p>
                    </div>
                  </div>
                )}

                {/* メンバー数 */}
                <div>
                  <span className="text-xs text-base-content/70">メンバー数</span>
                  <p className="font-semibold flex items-center gap-2">
                    <PersonIcon className="w-4 h-4" />
                    {workspaceDetail.members?.length || 0}
                  </p>
                </div>

                {/* ジャンル */}
                {workspaceDetail.genreName && (
                  <div>
                    <span className="text-xs text-base-content/70">ジャンル</span>
                    <p className="font-semibold flex items-center gap-2">
                      {workspaceDetail.genreIcon && (
                        <span className="text-xl">
                          {workspaceDetail.genreIcon}
                        </span>
                      )}
                      {workspaceDetail.genreName}
                    </p>
                  </div>
                )}

                {/* 更新日時 */}
                {workspaceDetail.updatedAt && (
                  <div>
                    <span className="text-xs text-base-content/70">更新日時</span>
                    <p className="font-semibold">
                      {new Date(workspaceDetail.updatedAt).toLocaleString(
                        "ja-JP"
                      )}
                    </p>
                  </div>
                )}

                {/* 更新者 */}
                {workspaceDetail.updatedBy?.userName && (
                  <div>
                    <span className="text-xs text-base-content/70">更新者</span>
                    <div className="flex items-center gap-2 mt-1">
                      {workspaceDetail.updatedBy.identityIconUrl && (
                        <img
                          src={workspaceDetail.updatedBy.identityIconUrl}
                          alt={workspaceDetail.updatedBy.userName}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <p className="font-semibold truncate">
                        {workspaceDetail.updatedBy.userName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* メンバー一覧 */}
              {workspaceDetail.members && workspaceDetail.members.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-bold mb-3">メンバー一覧</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {workspaceDetail.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 bg-base-200 rounded"
                      >
                        {member.identityIconUrl && (
                          <img
                            src={member.identityIconUrl}
                            alt={member.userName || "ユーザー"}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {member.userName}
                          </p>
                          {!member.isActive && (
                            <p className="text-xs text-base-content/50">
                              (非アクティブ)
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
