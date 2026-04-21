/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePersonalItemNoteRequest } from '../models/CreatePersonalItemNoteRequest';
import type { PersonalItemNoteResponse } from '../models/PersonalItemNoteResponse';
import type { UpdatePersonalItemNoteRequest } from '../models/UpdatePersonalItemNoteRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PersonalItemNoteService {
    /**
     * 個人メモを取得します
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @returns PersonalItemNoteResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsPersonalNote(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<PersonalItemNoteResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/personal-note',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * 個人メモを作成します
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param requestBody キャンセルトークン
     * @returns PersonalItemNoteResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesItemsPersonalNote(
        workspaceId: number,
        itemId: number,
        requestBody: CreatePersonalItemNoteRequest,
    ): CancelablePromise<PersonalItemNoteResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/personal-note',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * 個人メモを更新します
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param requestBody キャンセルトークン
     * @returns PersonalItemNoteResponse OK
     * @throws ApiError
     */
    public static putApiWorkspacesItemsPersonalNote(
        workspaceId: number,
        itemId: number,
        requestBody: UpdatePersonalItemNoteRequest,
    ): CancelablePromise<PersonalItemNoteResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/personal-note',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * 個人メモを削除します
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @returns void
     * @throws ApiError
     */
    public static deleteApiWorkspacesItemsPersonalNote(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/personal-note',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
        });
    }
}
