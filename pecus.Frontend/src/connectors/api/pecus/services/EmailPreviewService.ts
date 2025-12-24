/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailTemplateInfo } from '../models/EmailTemplateInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EmailPreviewService {
    /**
     * 利用可能なテンプレート一覧を取得
     * @returns EmailTemplateInfo OK
     * @throws ApiError
     */
    public static getApiDevEmailPreview(): CancelablePromise<Array<EmailTemplateInfo>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dev/email-preview',
        });
    }
    /**
     * 指定したテンプレートのHTMLプレビューを取得
     * ダミーデータを使用してレンダリング
     * @param templateName テンプレート名
     * @returns string OK
     * @throws ApiError
     */
    public static getApiDevEmailPreview1(
        templateName: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dev/email-preview/{templateName}',
            path: {
                'templateName': templateName,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * 指定したテンプレートのテキスト版プレビューを取得
     * @param templateName テンプレート名
     * @returns string OK
     * @throws ApiError
     */
    public static getApiDevEmailPreviewText(
        templateName: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dev/email-preview/{templateName}/text',
            path: {
                'templateName': templateName,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * プレビュー用の簡易インデックスページを返す
     * @returns string OK
     * @throws ApiError
     */
    public static getApiDevEmailPreviewIndex(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dev/email-preview/index',
        });
    }
}
