'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  DashboardHelpCommentsResponse,
  DashboardPersonalSummaryResponse,
  DashboardSummaryResponse,
  DashboardTasksByPriorityResponse,
  DashboardTaskTrendResponse,
  DashboardWorkspaceBreakdownResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * 組織のダッシュボードサマリを取得
 * タスクとアイテムの現在状態を集計したサマリ情報
 */
export async function fetchDashboardSummary(): Promise<ApiResponse<DashboardSummaryResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.dashboard.getApiDashboardSummary();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch dashboard summary:', error);
    return parseErrorResponse(error, 'ダッシュボードサマリの取得に失敗しました');
  }
}

/**
 * 組織の優先度別タスク数を取得
 * 進行中タスクの優先度別内訳
 */
export async function fetchTasksByPriority(): Promise<ApiResponse<DashboardTasksByPriorityResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.dashboard.getApiDashboardTasksByPriority();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch tasks by priority:', error);
    return parseErrorResponse(error, '優先度別タスク数の取得に失敗しました');
  }
}

/**
 * 個人のダッシュボードサマリを取得
 * ログインユーザー自身のタスク状況
 */
export async function fetchPersonalSummary(): Promise<ApiResponse<DashboardPersonalSummaryResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.dashboard.getApiDashboardPersonalSummary();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch personal summary:', error);
    return parseErrorResponse(error, '個人サマリの取得に失敗しました');
  }
}

/**
 * ワークスペース別統計を取得
 * 組織内の各ワークスペースのタスク・アイテム状況
 */
export async function fetchWorkspaceBreakdown(): Promise<ApiResponse<DashboardWorkspaceBreakdownResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.dashboard.getApiDashboardWorkspaces();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch workspace breakdown:', error);
    return parseErrorResponse(error, 'ワークスペース別統計の取得に失敗しました');
  }
}

/**
 * 週次タスクトレンドを取得
 * タスクの作成数/完了数の週次推移
 * @param weeks 取得する週数（1-12、デフォルト8）
 */
export async function fetchTaskTrend(weeks: number = 8): Promise<ApiResponse<DashboardTaskTrendResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.dashboard.getApiDashboardTasksTrend(weeks);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch task trend:', error);
    return parseErrorResponse(error, 'タスクトレンドの取得に失敗しました');
  }
}

/**
 * ダッシュボード用ヘルプコメントを取得
 * HelpWantedタイプのコメント一覧（組織設定の上限件数まで）
 */
export async function fetchHelpComments(): Promise<ApiResponse<DashboardHelpCommentsResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.dashboard.getApiDashboardHelpComments();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch help comments:', error);
    return parseErrorResponse(error, 'ヘルプコメントの取得に失敗しました');
  }
}
