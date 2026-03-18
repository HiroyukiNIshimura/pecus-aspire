/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateExternalWorkspaceItemRequest } from '../models/CreateExternalWorkspaceItemRequest';
import type { CreateExternalWorkspaceItemResponse } from '../models/CreateExternalWorkspaceItemResponse';
import type { PingRequest } from '../models/PingRequest';
import type { PingResponse } from '../models/PingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExternalService {
    /**
     * 疎通確認用エンドポイント
     * 受け取ったメッセージをそのまま返却します。
     * APIキー認証の疎通確認に使用してください。
     * @param requestBody
     * @returns PingResponse OK
     * @throws ApiError
     */
    public static postApiExternalPing(
        requestBody: PingRequest,
    ): CancelablePromise<PingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/external/ping',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * 指定したワークスペースにアイテムを作成する
     * Markdown形式の本文をLexical JSON形式に変換して保存します。
     * オーナーはワークスペースのメンバーである必要があります。
     * @param workspaceCode ワークスペースコード
     * @param requestBody 作成リクエスト
     * @returns CreateExternalWorkspaceItemResponse アイテムの作成に成功
     * @throws ApiError
     */
    public static postApiExternalWorkspacesItems(
        workspaceCode: string,
        requestBody: CreateExternalWorkspaceItemRequest,
    ): CancelablePromise<CreateExternalWorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/external/workspaces/{workspaceCode}/items',
            path: {
                'workspaceCode': workspaceCode,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが不正`,
                401: `認証エラー`,
                404: `ワークスペースまたはユーザーが見つからない`,
            },
        });
    }
}
