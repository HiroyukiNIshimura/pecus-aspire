'use client';

import {
  BadgeRankingCard,
  HelpCommentsCard,
  HotItemsCard,
  HotWorkspacesCard,
  PersonalSummarySection,
  PriorityBreakdownCard,
  TaskSummarySection,
  TaskTrendChart,
  WorkspaceBreakdownTable,
} from '@/components/dashboard';
import type {
  AchievementRankingResponse,
  DashboardHelpCommentsResponse,
  DashboardHotItemsResponse,
  DashboardHotWorkspacesResponse,
  DashboardPersonalSummaryResponse,
  DashboardSummaryResponse,
  DashboardTasksByPriorityResponse,
  DashboardTaskTrendResponse,
  DashboardWorkspaceBreakdownResponse,
} from '@/connectors/api/pecus';
import { useOrganizationSettings } from '@/providers/AppSettingsProvider';

interface DashboardClientProps {
  fetchError?: string | null;
  /** 組織サマリ */
  summary?: DashboardSummaryResponse | null;
  /** 優先度別タスク数 */
  tasksByPriority?: DashboardTasksByPriorityResponse | null;
  /** 個人サマリ */
  personalSummary?: DashboardPersonalSummaryResponse | null;
  /** ワークスペース別統計 */
  workspaceBreakdown?: DashboardWorkspaceBreakdownResponse | null;
  /** 週次タスクトレンド */
  taskTrend?: DashboardTaskTrendResponse | null;
  /** ホットアイテム */
  hotItems?: DashboardHotItemsResponse | null;
  /** ホットワークスペース */
  hotWorkspaces?: DashboardHotWorkspacesResponse | null;
  /** ヘルプコメント */
  helpComments?: DashboardHelpCommentsResponse | null;
  /** バッジ獲得ランキング */
  badgeRanking?: AchievementRankingResponse | null;
}

export default function DashboardClient({
  fetchError,
  summary,
  tasksByPriority,
  personalSummary,
  workspaceBreakdown,
  taskTrend,
  hotItems,
  hotWorkspaces,
  helpComments,
  badgeRanking,
}: DashboardClientProps) {
  const orgSettings = useOrganizationSettings();

  // ダッシュボードでのランキング表示条件（CheckVisibilityAccessAsync 準拠）:
  // - Gamification が有効
  // - GamificationBadgeVisibility が Organization の場合のみ表示
  // ※ Workspace / Private の場合は非表示（Workspace はワークスペース画面でのみ表示可）
  const showBadgeRanking =
    orgSettings.gamificationEnabled && orgSettings.gamificationBadgeVisibility === 'Organization';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ページヘッダー */}
      <header className="mb-2">
        <div className="flex items-center gap-3">
          <span className="icon-[mdi--view-dashboard-outline] text-primary w-8 h-8" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold">ダッシュボード</h1>
            <p className="text-base-content/70 mt-1">プロジェクトの概要と統計情報</p>
          </div>
        </div>
      </header>

      {/* エラー表示 */}
      {fetchError && (
        <div className="alert alert-error" role="alert">
          <span className="icon-[mdi--alert-circle-outline] w-5 h-5" aria-hidden="true" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* 個人サマリセクション */}
      {personalSummary && <PersonalSummarySection data={personalSummary} />}

      {/* 組織サマリセクション */}
      {summary && (
        <TaskSummarySection
          taskSummary={summary.taskSummary}
          itemSummary={summary.itemSummary}
          workspaceSummary={summary.workspaceSummary}
        />
      )}

      {/* 2カラムレイアウト: 優先度別（狭め） + ワークスペース別（広め） */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 優先度別タスク */}
        {tasksByPriority && (
          <div className="lg:col-span-1">
            <PriorityBreakdownCard data={tasksByPriority} />
          </div>
        )}

        {/* ワークスペース別統計 */}
        {workspaceBreakdown && (
          <div className="lg:col-span-2">
            <WorkspaceBreakdownTable data={workspaceBreakdown} />
          </div>
        )}
      </div>

      {/* 週次タスクトレンドチャート */}
      {taskTrend && <TaskTrendChart data={taskTrend} />}

      {/* 2カラムレイアウト: ホットアイテム + ホットワークスペース */}
      {(hotItems || hotWorkspaces) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hotItems && <HotItemsCard data={hotItems} />}
          {hotWorkspaces && <HotWorkspacesCard data={hotWorkspaces} />}
        </div>
      )}

      {/* 2カラムレイアウト: バッジランキング + ヘルプリクエスト */}
      {(showBadgeRanking || helpComments) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showBadgeRanking && badgeRanking && <BadgeRankingCard data={badgeRanking} />}
          {helpComments && <HelpCommentsCard data={helpComments} />}
        </div>
      )}

      {/* データがない場合のフォールバック */}
      {!summary &&
        !tasksByPriority &&
        !personalSummary &&
        !workspaceBreakdown &&
        !taskTrend &&
        !hotItems &&
        !hotWorkspaces &&
        !helpComments &&
        !badgeRanking &&
        !fetchError && (
          <div className="text-center py-12 text-base-content/60">
            <span className="icon-[mdi--chart-box-outline] w-16 h-16 mb-4" aria-hidden="true" />
            <p className="text-lg">統計データを読み込み中...</p>
          </div>
        )}
    </div>
  );
}
