import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
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
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function Dashboard() {
  let summary: DashboardSummaryResponse | null = null;
  let tasksByPriority: DashboardTasksByPriorityResponse | null = null;
  let personalSummary: DashboardPersonalSummaryResponse | null = null;
  let workspaceBreakdown: DashboardWorkspaceBreakdownResponse | null = null;
  let taskTrend: DashboardTaskTrendResponse | null = null;
  let hotItems: DashboardHotItemsResponse | null = null;
  let hotWorkspaces: DashboardHotWorkspacesResponse | null = null;
  let helpComments: DashboardHelpCommentsResponse | null = null;
  let badgeRanking: AchievementRankingResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ダッシュボード統計を並列取得
    const [
      summaryRes,
      priorityRes,
      personalRes,
      workspaceRes,
      trendRes,
      hotItemsRes,
      hotWorkspacesRes,
      helpCommentsRes,
      badgeRankingRes,
    ] = await Promise.allSettled([
      api.dashboard.getApiDashboardSummary(),
      api.dashboard.getApiDashboardTasksByPriority(),
      api.dashboard.getApiDashboardPersonalSummary(),
      api.dashboard.getApiDashboardWorkspaces(),
      api.dashboard.getApiDashboardTasksTrend(8),
      api.dashboard.getApiDashboardHotItems('1week', 5),
      api.dashboard.getApiDashboardHotWorkspaces('1week', 5),
      api.dashboard.getApiDashboardHelpComments(),
      api.achievement.getApiAchievementsRanking(),
    ]);

    // 結果を取得（エラーの場合はnull）
    summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
    tasksByPriority = priorityRes.status === 'fulfilled' ? priorityRes.value : null;
    personalSummary = personalRes.status === 'fulfilled' ? personalRes.value : null;
    workspaceBreakdown = workspaceRes.status === 'fulfilled' ? workspaceRes.value : null;
    taskTrend = trendRes.status === 'fulfilled' ? trendRes.value : null;
    hotItems = hotItemsRes.status === 'fulfilled' ? hotItemsRes.value : null;
    hotWorkspaces = hotWorkspacesRes.status === 'fulfilled' ? hotWorkspacesRes.value : null;
    helpComments = helpCommentsRes.status === 'fulfilled' ? helpCommentsRes.value : null;
    badgeRanking = badgeRankingRes.status === 'fulfilled' ? badgeRankingRes.value : null;

    // いずれかの取得に失敗した場合はログに残す
    if (summaryRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch summary', summaryRes.reason);
    }
    if (priorityRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch tasks by priority', priorityRes.reason);
    }
    if (personalRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch personal summary', personalRes.reason);
    }
    if (workspaceRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch workspace breakdown', workspaceRes.reason);
    }
    if (trendRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch task trend', trendRes.reason);
    }
    if (hotItemsRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch hot items', hotItemsRes.reason);
    }
    if (hotWorkspacesRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch hot workspaces', hotWorkspacesRes.reason);
    }
    if (helpCommentsRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch help comments', helpCommentsRes.reason);
    }
    if (badgeRankingRes.status === 'rejected') {
      console.error('Dashboard: failed to fetch badge ranking', badgeRankingRes.reason);
    }
  } catch (error) {
    console.error('Dashboard: failed to fetch dashboard data', error);
    fetchError = 'ダッシュボードデータの取得に失敗しました';
  }

  return (
    <DashboardClient
      fetchError={fetchError}
      summary={summary}
      tasksByPriority={tasksByPriority}
      personalSummary={personalSummary}
      workspaceBreakdown={workspaceBreakdown}
      taskTrend={taskTrend}
      hotItems={hotItems}
      hotWorkspaces={hotWorkspaces}
      helpComments={helpComments}
      badgeRanking={badgeRanking}
    />
  );
}
