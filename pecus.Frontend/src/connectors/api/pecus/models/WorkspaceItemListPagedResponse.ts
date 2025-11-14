/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemListResponse } from './WorkspaceItemListResponse';
/**
 * ワークスペースアイテム一覧ページングレスポンス
 */
export type WorkspaceItemListPagedResponse = {
    currentPage?: number;
    totalPages?: number;
    totalCount?: number;
    data?: Array<WorkspaceItemListResponse> | null;
};

