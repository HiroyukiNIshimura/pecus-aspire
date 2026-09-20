/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalItemSummaryResponse } from './ExternalItemSummaryResponse';
/**
 * 外部公開用アイテム一覧レスポンス
 */
export type ExternalItemListResponse = {
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    /**
     * 総件数
     */
    totalCount: number;
    /**
     * 現在のページ
     */
    currentPage: number;
    /**
     * ページあたりの件数
     */
    pageSize: number;
    /**
     * 次ページの有無
     */
    hasNextPage: boolean;
    /**
     * アイテムの配列
     */
    items: Array<ExternalItemSummaryResponse>;
};

