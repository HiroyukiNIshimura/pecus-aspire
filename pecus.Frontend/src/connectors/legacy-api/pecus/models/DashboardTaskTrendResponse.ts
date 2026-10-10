/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WeeklyTaskTrend } from './WeeklyTaskTrend';
/**
 * タスクトレンドレスポンス
 * 週次のタスク作成/完了推移データ
 */
export type DashboardTaskTrendResponse = {
    /**
     * 週次データのリスト
     */
    weeklyTrends: Array<WeeklyTaskTrend>;
    /**
     * 期間の開始日
     */
    startDate: string;
    /**
     * 期間の終了日
     */
    endDate: string;
};

