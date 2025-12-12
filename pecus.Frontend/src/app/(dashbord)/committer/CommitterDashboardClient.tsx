'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCommitterTasksByWorkspace } from '@/actions/myCommitter';
import AppHeader from '@/components/common/AppHeader';
import DashboardSidebar from '@/components/common/DashboardSidebar';
import WorkspaceTaskAccordion, { type WorkspaceInfo } from '@/components/common/WorkspaceTaskAccordion';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type { MyCommitterWorkspaceResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';

interface CommitterDashboardClientProps {
  initialUser?: UserInfo | null;
  initialWorkspaces: MyCommitterWorkspaceResponse[];
  taskTypes: TaskTypeOption[];
  fetchError?: string | null;
}

/**
 * コミッターダッシュボード（ワークスペース×期限日でグループ化）
 */
export default function CommitterDashboardClient({
  initialUser,
  initialWorkspaces,
  taskTypes,
  fetchError,
}: CommitterDashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);
  const notify = useNotify();

  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // 初期エラー表示
  useEffect(() => {
    if (fetchError) {
      notify.error(fetchError);
    }
  }, [fetchError, notify]);

  // ワークスペースデータをWorkspaceInfo型に変換
  const workspaces: WorkspaceInfo[] = initialWorkspaces.map((ws) => ({
    workspaceId: ws.workspaceId,
    workspaceCode: ws.workspaceCode,
    workspaceName: ws.workspaceName,
    genreIcon: ws.genreIcon,
    genreName: ws.genreName,
    activeTaskCount: ws.activeTaskCount,
    completedTaskCount: ws.completedTaskCount,
    overdueTaskCount: ws.overdueTaskCount,
    oldestDueDate: ws.oldestDueDate,
    itemCount: ws.itemCount,
  }));

  // タスク取得関数
  const handleFetchTasks = useCallback(async (workspaceId: number) => {
    const result = await fetchCommitterTasksByWorkspace(workspaceId);
    return result;
  }, []);

  // 統計情報を計算
  const totalItems = workspaces.reduce((sum, ws) => sum + (ws.itemCount || 0), 0);
  const totalActive = workspaces.reduce((sum, ws) => sum + ws.activeTaskCount, 0);
  const totalCompleted = workspaces.reduce((sum, ws) => sum + ws.completedTaskCount, 0);
  const totalOverdue = workspaces.reduce((sum, ws) => sum + ws.overdueTaskCount, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader userInfo={userInfo} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        <DashboardSidebar sidebarOpen={sidebarOpen} isAdmin={userInfo?.isAdmin ?? false} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="サイドバーを閉じる"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 bg-base-100 overflow-y-auto">
          {/* ページヘッダー */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="icon-[mdi--account-check-outline] text-primary w-8 h-8" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-bold">コミッター</h1>
                <p className="text-base-content/70 mt-1">あなたがコミッターを担当するアイテムのタスク一覧（期日順）</p>
              </div>
            </div>
          </div>

          {/* 統計サマリー */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">ワークスペース</div>
              <div className="stat-value text-2xl">{workspaces.length}</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">アイテム</div>
              <div className="stat-value text-2xl">{totalItems}</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">アクティブ</div>
              <div className="stat-value text-2xl text-primary">{totalActive}</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">完了</div>
              <div className="stat-value text-2xl text-success">{totalCompleted}</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">期限超過</div>
              <div className="stat-value text-2xl text-error">{totalOverdue}</div>
            </div>
          </div>

          {/* ワークスペース×タスク一覧（アコーディオン） */}
          <WorkspaceTaskAccordion
            workspaces={workspaces}
            fetchTasks={handleFetchTasks}
            emptyMessage="コミッターを担当しているアイテムがありません"
            emptyIconClass="icon-[mdi--clipboard-text-off-outline]"
            showItemCount={true}
            taskTypes={taskTypes}
            displayMode="assigned"
            currentUser={
              userInfo
                ? {
                    id: userInfo.id,
                    username: userInfo.username ?? userInfo.name,
                    email: userInfo.email,
                    identityIconUrl: userInfo.identityIconUrl,
                  }
                : null
            }
          />
        </main>
      </div>
    </div>
  );
}
