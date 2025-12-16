/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 個人ダッシュボード統計レスポンス
 * ログインユーザー自身のタスク状況を集計
 */
export type DashboardPersonalSummaryResponse = {
    /**
     * 担当中タスク数（未完了・未破棄）
     */
    assignedCount: number | string;
    /**
     * 完了タスク数（指定期間内）
     */
    completedCount: number | string;
    /**
     * 期限切れタスク数
     */
    overdueCount: number | string;
    /**
     * 今週期限タスク数
     */
    dueThisWeekCount: number | string;
    /**
     * 今週完了したタスク数（ActivityベースではなくCompletedAtベース）
     */
    completedThisWeekCount: number | string;
};

