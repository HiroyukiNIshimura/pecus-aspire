/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RequestPasswordResetRequest } from '../models/RequestPasswordResetRequest';
import type { ResetPasswordRequest } from '../models/ResetPasswordRequest';
import type { SetUserPasswordRequest } from '../models/SetUserPasswordRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EntrancePasswordService {
    /**
     * /// パスワードを設定
     * メールで送信されたトークンを使ってパスワードを設定します。
     * トークンは24時間有効です。
     * @param requestBody パスワード設定リクエスト
     * @returns SuccessResponse パスワードが設定されました
     * @throws ApiError
     */
    public static postApiEntrancePasswordSet(
        requestBody?: SetUserPasswordRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/entrance/password/set',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `トークンが無効または期限切れです`,
            },
        });
    }
    /**
     * パスワードリセットをリクエスト
     * メールアドレスを入力してパスワードリセットをリクエストします。
     * パスワードリセット用のメールが送信されます。
     * @param requestBody パスワードリセットリクエスト
     * @returns SuccessResponse パスワードリセットメールが送信されました
     * @throws ApiError
     */
    public static postApiEntrancePasswordRequestReset(
        requestBody?: RequestPasswordResetRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/entrance/password/request-reset',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * パスワードをリセット
     * メールで送信されたトークンを使ってパスワードをリセットします。
     * トークンは24時間有効です。
     * @param requestBody パスワードリセットリクエスト
     * @returns SuccessResponse パスワードがリセットされました
     * @throws ApiError
     */
    public static postApiEntrancePasswordReset(
        requestBody?: ResetPasswordRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/entrance/password/reset',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `トークンが無効または期限切れです`,
            },
        });
    }
}
