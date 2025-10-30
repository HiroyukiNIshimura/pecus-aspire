/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemDetailResponsePagedResponse } from '../models/WorkspaceItemDetailResponsePagedResponse';
import type { WorkspaceItemResponse } from '../models/WorkspaceItemResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceItemPinService {
    /**
     * ワークスペースアイテムにPINを追加
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesItemsPin(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/pin',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムからPINを削除
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static deleteApiWorkspacesItemsPin(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/pin',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ログインユーザーがPINしたアイテム一覧を取得
     * @param page ページ番号（1から開始）
     * @returns WorkspaceItemDetailResponsePagedResponse OK
     * @throws ApiError
     */
    public static getApiUsersMePinnedItems(
        page?: number,
    ): CancelablePromise<WorkspaceItemDetailResponsePagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/pinned-items',
            query: {
                'Page': page,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
