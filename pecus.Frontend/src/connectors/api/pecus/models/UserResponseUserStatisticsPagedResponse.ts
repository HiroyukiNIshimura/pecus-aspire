/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserResponse } from './UserResponse';
import type { UserStatistics } from './UserStatistics';
/**
 * ページネーション付きレスポンス（統計情報付き）
 */
export type UserResponseUserStatisticsPagedResponse = {
    /**
     * データのリスト
     */
    data: Array<UserResponse> | null;
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
    summary?: UserStatistics;
};

