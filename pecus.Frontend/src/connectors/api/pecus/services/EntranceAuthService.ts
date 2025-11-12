/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoginRequest } from '../models/LoginRequest';
import type { LoginResponse } from '../models/LoginResponse';
import type { RefreshRequest } from '../models/RefreshRequest';
import type { RefreshResponse } from '../models/RefreshResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EntranceAuthService {
    /**
     * ログイン
     * EmailまたはLoginIdとパスワードでログインします
     * @param requestBody
     * @returns LoginResponse OK
     * @throws ApiError
     */
    public static postApiEntranceAuthLogin(
        requestBody?: LoginRequest,
    ): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/entrance/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * リフレッシュトークンによるアクセストークン再発行
     * 有効なリフレッシュトークンを使用して、新しいアクセストークンとリフレッシュトークンを取得します。
     * @param requestBody リフレッシュトークン情報
     * @returns RefreshResponse OK
     * @throws ApiError
     */
    public static postApiEntranceRefresh(
        requestBody?: RefreshRequest,
    ): CancelablePromise<RefreshResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/entrance/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ログアウト（トークン無効化）
     * 現在のアクセストークンとリフレッシュトークンを無効化します。
     * @param requestBody リフレッシュトークン情報
     * @returns void
     * @throws ApiError
     */
    public static postApiEntranceLogout(
        requestBody?: RefreshRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/entrance/logout',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
