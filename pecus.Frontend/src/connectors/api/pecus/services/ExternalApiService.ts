/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PingRequest } from '../models/PingRequest';
import type { PingResponse } from '../models/PingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExternalApiService {
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
}
