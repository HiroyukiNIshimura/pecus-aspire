/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemListResponse } from './WorkspaceItemListResponse';
/**
 * ワークスペースアイテム一覧ページングレスポンス
 */
export type WorkspaceItemListPagedResponse = {
    /**
     * 現在のページ
     */
    currentPage?: number;
    /**
     * 総ページ数
     */
    totalPages?: number;
    /**
     * 総アイテム数
     */
    totalCount?: number;
    /**
     * アイテムデータ
     */
    data?: Array<WorkspaceItemListResponse> | null;
};

