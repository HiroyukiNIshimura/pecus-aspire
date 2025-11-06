/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateWorkspaceItemRequest } from '../models/CreateWorkspaceItemRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { TaskPriority } from '../models/TaskPriority';
import type { UpdateWorkspaceItemRequest } from '../models/UpdateWorkspaceItemRequest';
import type { UpdateWorkspaceItemStatusRequest } from '../models/UpdateWorkspaceItemStatusRequest';
import type { WorkspaceItemDetailResponse } from '../models/WorkspaceItemDetailResponse';
import type { WorkspaceItemDetailResponsePagedResponse } from '../models/WorkspaceItemDetailResponsePagedResponse';
import type { WorkspaceItemResponse } from '../models/WorkspaceItemResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceItemService {
    /**
     * ワークスペースアイテム作成
     * @param workspaceId
     * @param requestBody
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesItems(
        workspaceId: number,
        requestBody?: CreateWorkspaceItemRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items',
            path: {
                'workspaceId': workspaceId,
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
    /**
     * ワークスペースアイテム一覧取得
     * @param workspaceId
     * @param page
     * @param isDraft
     * @param isArchived
     * @param assigneeId
     * @param priority
     * @param pinned
     * @returns WorkspaceItemDetailResponsePagedResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItems(
        workspaceId: number,
        page?: number,
        isDraft?: boolean,
        isArchived?: boolean,
        assigneeId?: number,
        priority?: TaskPriority,
        pinned?: boolean,
    ): CancelablePromise<WorkspaceItemDetailResponsePagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items',
            path: {
                'workspaceId': workspaceId,
            },
            query: {
                'Page': page,
                'IsDraft': isDraft,
                'IsArchived': isArchived,
                'AssigneeId': assigneeId,
                'Priority': priority,
                'Pinned': pinned,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテム取得
     * @param workspaceId
     * @param itemId
     * @returns WorkspaceItemDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItems1(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<WorkspaceItemDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテム更新
     * @param workspaceId
     * @param itemId
     * @param requestBody
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static patchApiWorkspacesItems(
        workspaceId: number,
        itemId: number,
        requestBody?: UpdateWorkspaceItemRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/workspaces/{workspaceId}/items/{itemId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                409: `Conflict`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテム削除
     * @param workspaceId
     * @param itemId
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiWorkspacesItems(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}',
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
     * ワークスペースアイテムステータス更新
     * @param workspaceId
     * @param itemId
     * @param requestBody
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static patchApiWorkspacesItemsStatus(
        workspaceId: number,
        itemId: number,
        requestBody?: UpdateWorkspaceItemStatusRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/status',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                409: `Conflict`,
                500: `Internal Server Error`,
            },
        });
    }
}
