import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
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
import { getLandingPageUrl } from '@/utils/landingPage';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

/**
 * 内部ナビゲーションかどうかを判定
 * Refererが同一オリジンの場合は内部ナビゲーションとみなす
 */
async function isInternalNavigation(): Promise<boolean> {
  const headersList = await headers();
  const referer = headersList.get('referer');

  if (!referer) {
    // Refererがない = 直接URL入力、ブックマーク、新規タブ = 外部アクセス
    return false;
  }

  // 同一オリジンからのアクセスかチェック
  const host = headersList.get('host');
  if (host) {
    try {
      const refererUrl = new URL(referer);
      // Refererのホストが現在のホストと一致すれば内部ナビゲーション
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  return false;
}

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function Dashboard() {
  const api = createPecusApiClients();

  // ランディングページ設定を取得し、ダッシュボード以外が設定されていればリダイレクト
  // ただし、内部ナビゲーション（サイドバーからのクリック等）の場合はリダイレクトしない
  // これにより「起動時のデフォルトページ」としてのみ機能する
  const isInternal = await isInternalNavigation();
  if (!isInternal) {
    try {
      const appSettings = await api.profile.getApiProfileAppSettings();
      if (appSettings.currentUser.isBackOffice) {
        redirect(getLandingPageUrl('BackOffice'));
      }

      const landingPage = appSettings.user?.landingPage;
      if (landingPage && landingPage !== 'Dashboard') {
        redirect(getLandingPageUrl(landingPage));
      }
    } catch (error) {
      // Next.js の redirect() は NEXT_REDIRECT エラーをスローするため、再スローが必要
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        throw error;
      }
      // 取得失敗時はダッシュボードを表示（ログインページへのリダイレクトはlayoutで処理）
      console.error('Dashboard: failed to check landing page setting', error);
    }
  }

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
