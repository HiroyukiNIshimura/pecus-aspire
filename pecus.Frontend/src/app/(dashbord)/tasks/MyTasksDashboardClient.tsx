'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMyTasksByWorkspace } from '@/actions/myTask';
import AppHeader from '@/components/common/AppHeader';
import DashboardSidebar from '@/components/common/DashboardSidebar';
import WorkspaceTaskAccordion, { type WorkspaceInfo } from '@/components/common/WorkspaceTaskAccordion';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type { MyTaskWorkspaceResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';

interface MyTasksDashboardClientProps {
  initialUser?: UserInfo | null;
  initialWorkspaces: MyTaskWorkspaceResponse[];
  taskTypes: TaskTypeOption[];
  fetchError?: string | null;
}

/**
 * マイタスクダッシュボード（ワークスペース×期限日でグループ化）
 */
export default function MyTasksDashboardClient({
  initialUser,
  initialWorkspaces,
  taskTypes,
  fetchError,
}: MyTasksDashboardClientProps) {
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
  }));

  // タスク取得関数
  const handleFetchTasks = useCallback(async (workspaceId: number) => {
    const result = await fetchMyTasksByWorkspace(workspaceId);
    return result;
  }, []);

  // 統計情報を計算
  const totalActive = workspaces.reduce((sum, ws) => sum + ws.activeTaskCount, 0);
  const totalCompleted = workspaces.reduce((sum, ws) => sum + ws.completedTaskCount, 0);
  const totalOverdue = workspaces.reduce((sum, ws) => sum + ws.overdueTaskCount, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader userInfo={userInfo} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
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
        <main className="flex-1 p-4 md:p-6 bg-base-100 overflow-auto h-[calc(100vh-4rem)]">
          {/* ページヘッダー */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="icon-[mdi--clipboard-check-outline] text-primary w-8 h-8" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-bold">タスク</h1>
                <p className="text-base-content/70 mt-1">あなたに割り当てられたタスクの一覧（期日順）</p>
              </div>
            </div>
          </div>

          {/* 統計サマリー */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">ワークスペース</div>
              <div className="stat-value text-2xl">{workspaces.length}</div>
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
            emptyMessage="担当のタスクがありません"
            emptyIconClass="icon-[mdi--clipboard-check-outline]"
            showItemCount={false}
            taskTypes={taskTypes}
            displayMode="committer"
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
