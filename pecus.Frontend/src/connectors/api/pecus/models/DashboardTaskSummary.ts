/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タスクサマリ（WorkspaceTask ベース）
 */
export type DashboardTaskSummary = {
    /**
     * 進行中タスク数（未完了・未破棄）
     */
    inProgressCount: number;
    /**
     * 完了タスク数
     */
    completedCount: number;
    /**
     * 破棄タスク数
     */
    discardedCount: number;
    /**
     * 期限切れタスク数（期限超過の未完了タスク）
     */
    overdueCount: number;
    /**
     * 今週期限タスク数（今週中に期限の未完了タスク）
     */
    dueThisWeekCount: number;
    /**
     * 総タスク数
     */
    totalCount: number;
};

