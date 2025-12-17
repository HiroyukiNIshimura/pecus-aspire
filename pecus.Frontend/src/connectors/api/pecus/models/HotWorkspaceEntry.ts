/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceMode } from './WorkspaceMode';
/**
 * ホットワークスペースのエントリ
 */
export type HotWorkspaceEntry = {
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
     * タスク追加数（直近）
     */
    taskAddedCount: number;
    /**
     * タスク完了数（直近）
     */
    taskCompletedCount: number;
    /**
     * タスク関連アクティビティの合計
     */
    totalTaskActivityCount: number;
};

