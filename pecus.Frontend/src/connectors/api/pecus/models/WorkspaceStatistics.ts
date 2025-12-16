/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenreCount } from './GenreCount';
/**
 * ワークスペース統計情報レスポンス
 */
export type WorkspaceStatistics = {
    /**
     * アクティブなワークスペースの総数
     */
    activeWorkspaceCount: number | string;
    /**
     * 非アクティブなワークスペースの総数
     */
    inactiveWorkspaceCount: number | string;
    /**
     * 総ワークスペース数（アクティブ + 非アクティブ）
     */
    totalWorkspaceCount: number | string;
    /**
     * ワークスペースメンバーの総数（ユニークなユーザー数）
     */
    uniqueMemberCount: number | string;
    /**
     * 平均メンバー数 per ワークスペース
     */
    averageMembersPerWorkspace: number | string;
    /**
     * 最近作成されたワークスペース数（過去30日）
     */
    recentWorkspaceCount: number | string;
    /**
     * ワークスペースのジャンルごとのワークスペース数
     */
    workspaceCountByGenre: Array<GenreCount>;
};

