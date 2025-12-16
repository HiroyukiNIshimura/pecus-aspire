/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityResponse } from './ActivityResponse';
/**
 * ページネーション付きレスポンス
 */
export type PagedResponseOfActivityResponse = {
    /**
     * データのリスト
     */
    data: Array<ActivityResponse>;
    /**
     * 現在のページ番号（1から始まる）
     */
    currentPage?: number | string;
    /**
     * 1ページあたりのアイテム数
     */
    pageSize?: number | string;
    /**
     * 総アイテム数
     */
    totalCount?: number | string;
    /**
     * 総ページ数
     */
    totalPages?: number | string;
    /**
     * 前のページが存在するか
     */
    hasPreviousPage?: boolean;
    /**
     * 次のページが存在するか
     */
    hasNextPage?: boolean;
};

