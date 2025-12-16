/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateOrganizationRequest } from '../models/CreateOrganizationRequest';
import type { OrganizationWithAdminResponse } from '../models/OrganizationWithAdminResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EntranceOrganizationService {
    /**
     * 組織登録（管理者ユーザーも同時作成）
     * 新規組織を登録し、管理者ユーザーを同時に作成します。
     * このエンドポイントは未認証でアクセス可能です（新規サインアップ用）。
     * 管理者ユーザーへはパスワード設定メールが送信されます。
     * @param requestBody
     * @returns OrganizationWithAdminResponse OK
     * @throws ApiError
     */
    public static postApiEntranceOrganizations(
        requestBody: CreateOrganizationRequest,
    ): CancelablePromise<OrganizationWithAdminResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/entrance/organizations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
}
