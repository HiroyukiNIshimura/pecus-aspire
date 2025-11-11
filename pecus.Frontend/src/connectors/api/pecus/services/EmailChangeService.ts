/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailChangeRequestResponse } from '../models/EmailChangeRequestResponse';
import type { EmailChangeVerifyResponse } from '../models/EmailChangeVerifyResponse';
import type { PendingEmailChangeResponse } from '../models/PendingEmailChangeResponse';
import type { RequestEmailChangeRequest } from '../models/RequestEmailChangeRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EmailChangeService {
    /**
     * メールアドレス変更をリクエスト
     * 新しいメールアドレスとパスワード（本人確認用）を送信します。
     * 確認メールが送信され、24時間有効なトークンが発行されます。
     * @param requestBody メールアドレス変更リクエスト
     * @returns EmailChangeRequestResponse 確認メールを送信しました
     * @throws ApiError
     */
    public static postApiProfileEmailRequestChange(
        requestBody?: RequestEmailChangeRequest,
    ): CancelablePromise<EmailChangeRequestResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profile/email/request-change',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが無効です（パスワード不一致、重複メールアドレスなど）`,
                404: `ユーザーが見つかりません`,
                500: `サーバーエラー`,
            },
        });
    }
    /**
     * メールアドレス変更を確認（トークン検証）
     * 確認メールに記載されたトークンを検証し、メールアドレスを変更します。
     * トークンは24時間有効で、一度のみ使用可能です。
     * @param token 確認トークン（GUIDベース、32文字）
     * @returns EmailChangeVerifyResponse メールアドレスの変更が完了しました
     * @throws ApiError
     */
    public static getApiProfileEmailVerify(
        token?: string,
    ): CancelablePromise<EmailChangeVerifyResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile/email/verify',
            query: {
                'token': token,
            },
            errors: {
                400: `トークンが無効または期限切れです`,
                404: `ユーザーまたはトークンが見つかりません`,
                500: `サーバーエラー`,
            },
        });
    }
    /**
     * 未使用のメールアドレス変更トークン情報を取得
     * ユーザーの有効な（未使用かつ期限内の）メールアドレス変更トークン情報を取得します。
     * トークン本体は返しませんが、新しいメールアドレスと有効期限を確認できます。
     * @returns PendingEmailChangeResponse トークン情報を取得しました（存在する場合）
     * @throws ApiError
     */
    public static getApiProfileEmailPending(): CancelablePromise<PendingEmailChangeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile/email/pending',
            errors: {
                500: `サーバーエラー`,
            },
        });
    }
}
