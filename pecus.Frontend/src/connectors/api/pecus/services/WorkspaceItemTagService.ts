/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SetTagsToItemRequest } from '../models/SetTagsToItemRequest';
import type { WorkspaceItemResponse } from '../models/WorkspaceItemResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceItemTagService {
    /**
     * ワークスペースアイテムのタグを一括設定
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param requestBody タグ一括設定リクエスト
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static putApiWorkspacesItemsTags(
        workspaceId: number,
        itemId: number,
        requestBody?: SetTagsToItemRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tags',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
