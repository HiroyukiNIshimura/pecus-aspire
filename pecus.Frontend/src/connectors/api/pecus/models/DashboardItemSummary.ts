/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * アイテムサマリ（WorkspaceItem ベース）
 */
export type DashboardItemSummary = {
    /**
     * 公開アイテム数（公開済み・未アーカイブ）
     */
    publishedCount: number;
    /**
     * 下書きアイテム数
     */
    draftCount: number;
    /**
     * アーカイブ済みアイテム数
     */
    archivedCount: number;
    /**
     * 総アイテム数
     */
    totalCount: number;
};

