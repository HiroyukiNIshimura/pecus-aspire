'use server';

import {
  analyzeDashboardHealthWithHeyApi,
  getDashboardHelpCommentsWithHeyApi,
  getDashboardPersonalSummaryWithHeyApi,
  getDashboardSummaryWithHeyApi,
  getDashboardTasksByPriorityWithHeyApi,
  getDashboardTasksTrendWithHeyApi,
  getDashboardWorkspacesWithHeyApi,
} from '@/connectors/HeyApiClient';
import type {
  DashboardHelpCommentsResponse,
  DashboardPersonalSummaryResponse,
  DashboardSummaryResponse,
  DashboardTasksByPriorityResponse,
  DashboardTaskTrendResponse,
  DashboardWorkspaceBreakdownResponse,
  HealthAnalysisRequest,
  HealthAnalysisResponse,
} from '@/connectors/hey-api-axios/types.gen';
import { type AnalyzeHealthInput, analyzeHealthInputSchema } from '@/schemas/dashboardSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

/**
 * 組織のダッシュボードサマリを取得
 * タスクとアイテムの現在状態を集計したサマリ情報
 */
export async function fetchDashboardSummary(): Promise<ApiResponse<DashboardSummaryResponse>> {
  try {
    const response = await getDashboardSummaryWithHeyApi();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch dashboard summary:', error);
    return handleApiErrorForAction<DashboardSummaryResponse>(error, {
      defaultMessage: 'ダッシュボードサマリの取得に失敗しました',
    });
  }
}

/**
 * 組織の優先度別タスク数を取得
 * 進行中タスクの優先度別内訳
 */
export async function fetchTasksByPriority(): Promise<ApiResponse<DashboardTasksByPriorityResponse>> {
  try {
    const response = await getDashboardTasksByPriorityWithHeyApi();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch tasks by priority:', error);
    return handleApiErrorForAction<DashboardTasksByPriorityResponse>(error, {
      defaultMessage: '優先度別タスク数の取得に失敗しました',
    });
  }
}

/**
 * 個人のダッシュボードサマリを取得
 * ログインユーザー自身のタスク状況
 */
export async function fetchPersonalSummary(): Promise<ApiResponse<DashboardPersonalSummaryResponse>> {
  try {
    const response = await getDashboardPersonalSummaryWithHeyApi();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch personal summary:', error);
    return handleApiErrorForAction<DashboardPersonalSummaryResponse>(error, {
      defaultMessage: '個人サマリの取得に失敗しました',
    });
  }
}

/**
 * ワークスペース別統計を取得
 * 組織内の各ワークスペースのタスク・アイテム状況
 */
export async function fetchWorkspaceBreakdown(): Promise<ApiResponse<DashboardWorkspaceBreakdownResponse>> {
  try {
    const response = await getDashboardWorkspacesWithHeyApi();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch workspace breakdown:', error);
    return handleApiErrorForAction<DashboardWorkspaceBreakdownResponse>(error, {
      defaultMessage: 'ワークスペース別統計の取得に失敗しました',
    });
  }
}

/**
 * 週次タスクトレンドを取得
 * タスクの作成数/完了数の週次推移
 * @param weeks 取得する週数（1-12、デフォルト8）
 */
export async function fetchTaskTrend(weeks: number = 8): Promise<ApiResponse<DashboardTaskTrendResponse>> {
  try {
    const response = await getDashboardTasksTrendWithHeyApi(weeks);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch task trend:', error);
    return handleApiErrorForAction<DashboardTaskTrendResponse>(error, {
      defaultMessage: 'タスクトレンドの取得に失敗しました',
    });
  }
}

/**
 * ダッシュボード用ヘルプコメントを取得
 * HelpWantedタイプのコメント一覧（組織設定の上限件数まで）
 */
export async function fetchHelpComments(): Promise<ApiResponse<DashboardHelpCommentsResponse>> {
  try {
    const response = await getDashboardHelpCommentsWithHeyApi();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch help comments:', error);
    return handleApiErrorForAction<DashboardHelpCommentsResponse>(error, {
      defaultMessage: 'ヘルプコメントの取得に失敗しました',
    });
  }
}

/**
 * AIによるワークスペース/組織の健康状態分析を実行
 * @param request 分析リクエスト（スコープ、分析タイプ、ワークスペースID等）
 */
export async function analyzeHealth(input: AnalyzeHealthInput): Promise<ApiResponse<HealthAnalysisResponse>> {
  const parseResult = analyzeHealthInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const request: HealthAnalysisRequest = {
      scope: parseResult.data.scope,
      workspaceId: parseResult.data.workspaceId,
      analysisType: parseResult.data.analysisType,
    };
    const response = await analyzeDashboardHealthWithHeyApi(request);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to analyze health:', error);
    return handleApiErrorForAction<HealthAnalysisResponse>(error, {
      defaultMessage: '健康状態の分析に失敗しました',
    });
  }
}
