/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TempAttachmentResponse } from '../models/TempAttachmentResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceItemTempAttachmentService {
    /**
     * 一時添付ファイルをアップロード（アイテム作成前用）
     * @param workspaceId ワークスペースID
     * @param sessionId セッション識別子（フロントで生成したUUID等）
     * @param formData
     * @returns TempAttachmentResponse Created
     * @throws ApiError
     */
    public static postApiWorkspacesTempAttachments(
        workspaceId: number,
        sessionId: string,
        formData?: {
            /**
             * アップロードするファイル
             */
            file?: Blob;
        },
    ): CancelablePromise<TempAttachmentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/temp-attachments/{sessionId}',
            path: {
                'workspaceId': workspaceId,
                'sessionId': sessionId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * セッションの一時ファイルをすべて削除
     * @param workspaceId ワークスペースID
     * @param sessionId セッション識別子
     * @returns void
     * @throws ApiError
     */
    public static deleteApiWorkspacesTempAttachments(
        workspaceId: number,
        sessionId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/temp-attachments/{sessionId}',
            path: {
                'workspaceId': workspaceId,
                'sessionId': sessionId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * 一時添付ファイルを取得（プレビュー用）
     * @param workspaceId ワークスペースID
     * @param sessionId セッション識別子
     * @param fileName ファイル名
     * @returns any OK
     * @throws ApiError
     */
    public static getApiWorkspacesTempAttachments(
        workspaceId: number,
        sessionId: string,
        fileName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/temp-attachments/{sessionId}/{fileName}',
            path: {
                'workspaceId': workspaceId,
                'sessionId': sessionId,
                'fileName': fileName,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
