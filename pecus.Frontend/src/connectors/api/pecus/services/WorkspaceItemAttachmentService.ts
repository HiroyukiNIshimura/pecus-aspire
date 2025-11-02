/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemAttachmentResponse } from '../models/WorkspaceItemAttachmentResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceItemAttachmentService {
    /**
     * ワークスペースアイテムに添付ファイルをアップロード
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param formData
     * @returns WorkspaceItemAttachmentResponse Created
     * @throws ApiError
     */
    public static postApiWorkspacesItemsAttachments(
        workspaceId: number,
        itemId: number,
        formData?: {
            /**
             * アップロードするファイル
             */
            file?: Blob;
        },
    ): CancelablePromise<WorkspaceItemAttachmentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/attachments',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムの添付ファイル一覧を取得
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns WorkspaceItemAttachmentResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsAttachments(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<Array<WorkspaceItemAttachmentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/attachments',
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
     * 添付ファイルを削除
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param attachmentId 添付ファイルID
     * @returns void
     * @throws ApiError
     */
    public static deleteApiWorkspacesItemsAttachments(
        workspaceId: number,
        itemId: number,
        attachmentId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/attachments/{attachmentId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'attachmentId': attachmentId,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 添付ファイルをダウンロード
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param fileName ファイル名（一意なファイル名）
     * @returns any OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsAttachmentsDownload(
        workspaceId: number,
        itemId: number,
        fileName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/attachments/download/{fileName}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'fileName': fileName,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
