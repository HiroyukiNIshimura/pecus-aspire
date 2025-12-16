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
    inProgressCount: number | string;
    /**
     * 完了タスク数
     */
    completedCount: number | string;
    /**
     * 破棄タスク数
     */
    discardedCount: number | string;
    /**
     * 期限切れタスク数（期限超過の未完了タスク）
     */
    overdueCount: number | string;
    /**
     * 今週期限タスク数（今週中に期限の未完了タスク）
     */
    dueThisWeekCount: number | string;
    /**
     * 未アサインタスク数（担当者未設定の未完了・未破棄タスク）
     */
    unassignedCount: number | string;
    /**
     * 総タスク数
     */
    totalCount: number | string;
};

