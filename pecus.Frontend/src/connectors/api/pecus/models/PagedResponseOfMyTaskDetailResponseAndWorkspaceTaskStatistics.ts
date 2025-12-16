/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MyTaskDetailResponse } from './MyTaskDetailResponse';
import type { WorkspaceTaskStatistics } from './WorkspaceTaskStatistics';
/**
 * ページネーション付きレスポンス（統計情報付き）
 */
export type PagedResponseOfMyTaskDetailResponseAndWorkspaceTaskStatistics = {
    summary?: (null | WorkspaceTaskStatistics);
    /**
     * データのリスト
     */
    data: Array<MyTaskDetailResponse>;
    /**
     * 現在のページ番号（1から始まる）
     */
    currentPage?: number;
    /**
     * 1ページあたりのアイテム数
     */
    pageSize?: number;
    /**
     * 総アイテム数
     */
    totalCount?: number;
    /**
     * 総ページ数
     */
    totalPages?: number;
    /**
     * 前のページが存在するか
     */
    hasPreviousPage?: boolean;
    /**
     * 次のページが存在するか
     */
    hasNextPage?: boolean;
};

