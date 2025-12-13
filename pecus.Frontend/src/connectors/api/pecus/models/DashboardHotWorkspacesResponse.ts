/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HotWorkspaceEntry } from './HotWorkspaceEntry';
/**
 * ホットワークスペース統計レスポンス
 * タスク関連アクティビティが活発なワークスペースのランキング
 */
export type DashboardHotWorkspacesResponse = {
    /**
     * 集計期間（"24h" または "1week"）
     */
    period: string;
    /**
     * ホットワークスペースリスト（タスク関連アクティビティ数の多い順）
     */
    workspaces: Array<HotWorkspaceEntry>;
};

