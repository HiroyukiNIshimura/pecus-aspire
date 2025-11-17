"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import PersonIcon from "@mui/icons-material/Person";
import AppHeader from "@/components/common/AppHeader";
import WorkspaceItemsSidebar from "./WorkspaceItemsSidebar";
import WorkspaceItemDetail from "./WorkspaceItemDetail";
import type { UserInfo } from "@/types/userInfo";
import type {
  WorkspaceFullDetailResponse,
  WorkspaceListItemResponse,
} from "@/connectors/api/pecus";

interface WorkspaceDetailClientProps {
  workspaceId: string;
  workspaceDetail: WorkspaceFullDetailResponse;
  workspaces: WorkspaceListItemResponse[];
  userInfo: UserInfo | null;
}

export default function WorkspaceDetailClient({
  workspaceId,
  workspaceDetail,
  workspaces,
  userInfo,
}: WorkspaceDetailClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showWorkspaceDetail, setShowWorkspaceDetail] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // ローカルストレージからサイドバー幅を取得（初期値: 256px）
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("workspaceSidebarWidth");
      return saved ? parseInt(saved, 10) : 256;
    }
    return 256;
  });

  const handleBack = () => {
    router.back();
  };

  // ワークスペースHome選択ハンドラ
  const handleHomeSelect = useCallback(() => {
    setShowWorkspaceDetail(true);
    setSelectedItemId(null);
  }, []);

  // アイテム選択ハンドラ
  const handleItemSelect = useCallback((itemId: number) => {
    setShowWorkspaceDetail(false);
    setSelectedItemId(itemId);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // 最小幅200px、最大幅600px
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
        // ローカルストレージに保存
        localStorage.setItem("workspaceSidebarWidth", newWidth.toString());
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // マウスイベントリスナーの登録
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // ワークスペースヘッダー部分を共通コンポーネント化
  const WorkspaceHeader = () => (
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
  );

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <AppHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userInfo={userInfo}
      />

      {/* スマホ: ヘッダーのみ表示 */}
      <div className="lg:hidden bg-base-100 p-4 border-b border-base-300">
        <WorkspaceHeader />
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* 左サイドバー (PC) */}
        <div
          ref={sidebarRef}
          className="hidden lg:block h-full overflow-hidden relative"
          style={{ width: `${sidebarWidth}px` }}
        >
          <WorkspaceItemsSidebar
            workspaceId={parseInt(workspaceId)}
            workspaces={workspaces}
            onHomeSelect={handleHomeSelect}
            onItemSelect={handleItemSelect}
            scrollContainerId="itemsScrollableDiv-desktop"
          />

          {/* リサイズハンドル */}
          <div
            onMouseDown={handleMouseDown}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors ${
              isResizing ? "bg-primary" : ""
            }`}
            style={{ userSelect: "none" }}
          />
        </div>

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto bg-base-100 p-4 md:p-6 order-first lg:order-none">
          {/* ワークスペース詳細情報 */}
          {showWorkspaceDetail && (
            <div className="card bg-base-100 shadow-md mb-6">
            <div className="card-body">
              {/* ヘッダー (PC) */}
              <div className="hidden lg:block">
                <WorkspaceHeader />
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
          )}

          {/* アイテム詳細情報 */}
          {!showWorkspaceDetail && selectedItemId && (
            <WorkspaceItemDetail
              workspaceId={parseInt(workspaceId)}
              itemId={selectedItemId}
            />
          )}
        </main>

        {/* アイテム一覧 (スマホ) */}
        <div className="lg:hidden flex-shrink-0 border-t border-base-300" style={{ height: '384px' }}>
          <WorkspaceItemsSidebar
            workspaceId={parseInt(workspaceId)}
            workspaces={workspaces}
            onHomeSelect={handleHomeSelect}
            onItemSelect={handleItemSelect}
            scrollContainerId="itemsScrollableDiv-mobile"
          />
        </div>
      </div>
    </div>
  );
}
