/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PagedResponseOfActivityResponse } from '../models/PagedResponseOfActivityResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ActivityService {
    /**
     * アイテムのアクティビティ一覧を取得（タイムライン表示用）
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param page ページ番号（1から開始）
     * @returns PagedResponseOfActivityResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsActivities(
        workspaceId: number | string,
        itemId: number | string,
        page?: number | string,
    ): CancelablePromise<PagedResponseOfActivityResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/activities',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            query: {
                'page': page,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
