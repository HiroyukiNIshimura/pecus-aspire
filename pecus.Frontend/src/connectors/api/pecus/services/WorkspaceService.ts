/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceListItemResponseWorkspaceStatisticsPagedResponse } from '../models/WorkspaceListItemResponseWorkspaceStatisticsPagedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceService {
    /**
     * ログインユーザーがアクセス可能なワークスペース一覧取得（ページネーション）
     * @param page
     * @param isActive アクティブなワークスペースのみ取得するか
     * @param genreId ジャンルIDでフィルター（オプション）
     * @param name ワークスペース名で前方一致検索（オプション）
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
}
