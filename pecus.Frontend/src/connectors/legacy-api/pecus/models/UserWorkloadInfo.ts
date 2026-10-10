/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ユーザー負荷情報
 */
export type UserWorkloadInfo = {
    /**
     * ユーザーID
     */
    userId?: number;
    /**
     * 期限切れタスク数
     */
    overdueCount?: number;
    /**
     * 今日期限のタスク数
     */
    dueTodayCount?: number;
    /**
     * 今週期限のタスク数
     */
    dueThisWeekCount?: number;
    /**
     * 未完了タスク総数
     */
    totalActiveCount?: number;
    /**
     * 担当中のアイテム数（コンテキストスイッチ指標）
     */
    activeItemCount?: number;
    /**
     * 担当中のワークスペース数（コンテキストスイッチ指標）
     */
    activeWorkspaceCount?: number;
    /**
     * 負荷レベル: Low, Medium, High, Overloaded
     */
    workloadLevel?: string;
};

