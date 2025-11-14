/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceFullDetailResponse } from '../models/WorkspaceFullDetailResponse';
import type { WorkspaceItemListPagedResponse } from '../models/WorkspaceItemListPagedResponse';
import type { WorkspaceListItemResponseWorkspaceStatisticsPagedResponse } from '../models/WorkspaceListItemResponseWorkspaceStatisticsPagedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceService {
    /**
     * ログインユーザーがアクセス可能なワークスペース一覧取得（ページネーション）
     * @param page
     * @param isActive
     * @param genreId
     * @param name
     * @returns WorkspaceListItemResponseWorkspaceStatisticsPagedResponse OK
     * @throws ApiError
     */
    public static getApiWorkspaces(
        page?: number,
        isActive?: boolean,
        genreId?: number,
        name?: string,
    ): CancelablePromise<WorkspaceListItemResponseWorkspaceStatisticsPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces',
            query: {
                'Page': page,
                'IsActive': isActive,
                'GenreId': genreId,
                'Name': name,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペース詳細情報取得（ログインユーザーがアクセス可能なもののみ）
     * @param id ワークスペースID
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspaces1(
        id: number,
    ): CancelablePromise<WorkspaceFullDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペース内のアイテム一覧取得（有効なアイテムのみ、ページング対応）
     * @param id ワークスペースID
     * @param page ページ番号（1から始まる）
     * @returns WorkspaceItemListPagedResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItems(
        id: number,
        page?: number,
    ): CancelablePromise<WorkspaceItemListPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{id}/items',
            path: {
                'id': id,
            },
            query: {
                'Page': page,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
