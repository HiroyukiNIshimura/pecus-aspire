/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceMode } from './WorkspaceMode';
/**
 * ワークスペースごとの統計
 */
export type DashboardWorkspaceStatistics = {
    /**
     * ワークスペースID
     */
    workspaceId: number;
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
    mode?: WorkspaceMode;
    /**
     * ワークスペースの説明
     */
    description?: string | null;
    /**
     * 進行中タスク数
     */
    inProgressCount: number;
    /**
     * 完了タスク数
     */
    completedCount: number;
    /**
     * 期限切れタスク数
     */
    overdueCount: number;
    /**
     * アイテム数
     */
    itemCount: number;
    /**
     * メンバー数
     */
    memberCount: number;
    /**
     * 現在のユーザーがメンバーかどうか
     */
    isMember: boolean;
};

