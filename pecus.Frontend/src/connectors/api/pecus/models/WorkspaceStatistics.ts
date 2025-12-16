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
    activeWorkspaceCount: number;
    /**
     * 非アクティブなワークスペースの総数
     */
    inactiveWorkspaceCount: number;
    /**
     * 総ワークスペース数（アクティブ + 非アクティブ）
     */
    totalWorkspaceCount: number;
    /**
     * ワークスペースメンバーの総数（ユニークなユーザー数）
     */
    uniqueMemberCount: number;
    /**
     * 平均メンバー数 per ワークスペース
     */
    averageMembersPerWorkspace: number;
    /**
     * 最近作成されたワークスペース数（過去30日）
     */
    recentWorkspaceCount: number;
    /**
     * ワークスペースのジャンルごとのワークスペース数
     */
    workspaceCountByGenre: Array<GenreCount>;
};

