/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceUserDetailResponse } from './WorkspaceUserDetailResponse';
/**
 * ページネーション付きレスポンス（統計情報付き）
 */
export type WorkspaceUserDetailResponseObjectPagedResponse = {
    /**
     * データのリスト
     */
    data: Array<WorkspaceUserDetailResponse> | null;
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
    /**
     * リストデータの統計情報
     */
    summary?: any;
};

