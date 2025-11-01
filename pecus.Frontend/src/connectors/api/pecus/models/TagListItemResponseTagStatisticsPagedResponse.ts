/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TagListItemResponse } from './TagListItemResponse';
import type { TagStatistics } from './TagStatistics';
/**
 * ページネーション付きレスポンス（統計情報付き）
 */
export type TagListItemResponseTagStatisticsPagedResponse = {
    /**
     * データのリスト
     */
    data: Array<TagListItemResponse> | null;
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
    summary?: TagStatistics;
};

