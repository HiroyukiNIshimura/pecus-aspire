/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageResponse } from '../models/MessageResponse';
import type { RecipientRequest } from '../models/RecipientRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TestEmailService {
    /**
     * 利用可能なテンプレート一覧を返す
     * @returns string OK
     * @throws ApiError
     */
    public static getApiDevEmailTestTemplates(): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dev/email-test/templates',
        });
    }
    /**
     * テスト送信（テンプレート名を指定）
     * @param template テンプレート名（welcome, password-setup, password-reset, test-email）
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static postApiDevEmailTestSend(
        template?: string,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/dev/email-test/send',
            query: {
                'template': template,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * テスト用受信先を設定する
     * @param requestBody
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static postApiDevEmailTestSetRecipient(
        requestBody?: RecipientRequest,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/dev/email-test/set-recipient',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
}
