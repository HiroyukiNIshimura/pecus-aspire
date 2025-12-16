/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースごとの統計
 */
export type DashboardWorkspaceStatistics = {
    /**
     * ワークスペースID
     */
    workspaceId: number | string;
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    /**
     * ワークスペース名
     */
    workspaceName: string;
    /**
     * ジャンルアイコン
     */
    genreIcon?: string | null;
    /**
     * 進行中タスク数
     */
    inProgressCount: number | string;
    /**
     * 完了タスク数
     */
    completedCount: number | string;
    /**
     * 期限切れタスク数
     */
    overdueCount: number | string;
    /**
     * アイテム数
     */
    itemCount: number | string;
    /**
     * メンバー数
     */
    memberCount: number | string;
};

