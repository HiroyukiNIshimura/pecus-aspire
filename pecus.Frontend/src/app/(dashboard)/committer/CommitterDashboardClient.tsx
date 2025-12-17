'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCommitterTasksByWorkspace } from '@/actions/myCommitter';
import DashboardFilterBar from '@/components/common/filters/DashboardFilterBar';
import WorkspaceTaskAccordion, { type WorkspaceInfo } from '@/components/common/widgets/WorkspaceTaskAccordion';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type { DashboardTaskFilter, MyCommitterWorkspaceResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';

interface CommitterDashboardClientProps {
  initialWorkspaces: MyCommitterWorkspaceResponse[];
  taskTypes: TaskTypeOption[];
  fetchError?: string | null;
}

/**
 * コミッターダッシュボード（ワークスペース×期限日でグループ化）
 */
export default function CommitterDashboardClient({
  initialWorkspaces,
  taskTypes,
  fetchError,
}: CommitterDashboardClientProps) {
  const [currentFilter, setCurrentFilter] = useState<DashboardTaskFilter>('Active');
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
  const allWorkspaces: WorkspaceInfo[] = initialWorkspaces.map((ws) => ({
    listIndex: ws.listIndex ?? 0,
    workspaceId: ws.workspaceId,
    workspaceCode: ws.workspaceCode,
    workspaceName: ws.workspaceName,
    genreIcon: ws.genreIcon,
    genreName: ws.genreName,
    activeTaskCount: ws.activeTaskCount,
    completedTaskCount: ws.completedTaskCount,
    overdueTaskCount: ws.overdueTaskCount,
    oldestDueDate: ws.oldestDueDate,
    helpCommentCount: ws.helpCommentCount,
    reminderCommentCount: ws.reminderCommentCount,
    itemCount: ws.itemCount,
  }));

  // フィルタに応じたタスク数を取得するヘルパー関数
  const getFilteredTaskCount = (ws: WorkspaceInfo, filter: DashboardTaskFilter): number => {
    switch (filter) {
      case 'Active':
        return ws.activeTaskCount;
      case 'Completed':
        return ws.completedTaskCount;
      case 'Overdue':
        return ws.overdueTaskCount;
      case 'HelpWanted':
        return ws.helpCommentCount || 0;
      case 'Reminder':
        return ws.reminderCommentCount || 0;
      default:
        return ws.activeTaskCount;
    }
  };

  // フィルタに応じて該当タスクがあるワークスペースのみ表示し、displayTaskCountを設定
  const filteredWorkspaces = allWorkspaces
    .filter((ws) => getFilteredTaskCount(ws, currentFilter) > 0)
    .map((ws) => ({
      ...ws,
      displayTaskCount: getFilteredTaskCount(ws, currentFilter),
    }));

  // タスク取得関数（フィルタを適用）
  const handleFetchTasks = useCallback(
    async (workspaceId: number) => {
      const result = await fetchCommitterTasksByWorkspace(workspaceId, currentFilter);
      return result;
    },
    [currentFilter],
  );

  // 統計情報を計算（全ワークスペースから集計）
  const totalItems = allWorkspaces.reduce((sum, ws) => sum + (ws.itemCount || 0), 0);
  const totalActive = allWorkspaces.reduce((sum, ws) => sum + ws.activeTaskCount, 0);
  const totalCompleted = allWorkspaces.reduce((sum, ws) => sum + ws.completedTaskCount, 0);
  const totalOverdue = allWorkspaces.reduce((sum, ws) => sum + ws.overdueTaskCount, 0);
  const totalHelpComments = allWorkspaces.reduce((sum, ws) => sum + (ws.helpCommentCount || 0), 0);
  const totalReminderComments = allWorkspaces.reduce((sum, ws) => sum + (ws.reminderCommentCount || 0), 0);

  return (
    <>
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

      {/* フィルターバー */}
      <DashboardFilterBar
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        stats={{
          activeCount: totalActive,
          completedCount: totalCompleted,
          overdueCount: totalOverdue,
          helpCommentCount: totalHelpComments,
          reminderCommentCount: totalReminderComments,
        }}
        workspaceCount={allWorkspaces.length}
        itemCount={totalItems}
      />

      {/* ワークスペース×タスク一覧（アコーディオン） */}
      <WorkspaceTaskAccordion
        key={currentFilter}
        workspaces={filteredWorkspaces}
        fetchTasks={handleFetchTasks}
        emptyMessage="コミッターを担当しているアイテムがありません"
        emptyIconClass="icon-[mdi--clipboard-text-off-outline]"
        showItemCount={true}
        taskTypes={taskTypes}
        displayMode="assigned"
        currentUser={null}
      />
    </>
  );
}
