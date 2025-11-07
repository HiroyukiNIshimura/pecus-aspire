/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminUpdateOrganizationRequest } from '../models/AdminUpdateOrganizationRequest';
import type { OrganizationResponse } from '../models/OrganizationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminOrganizationService {
    /**
     * 自組織の情報を取得
     * ログイン中のユーザーが属する組織の詳細情報を取得します。
     * @returns OrganizationResponse OK
     * @throws ApiError
     */
    public static getApiAdminOrganization(): CancelablePromise<OrganizationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/organization',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 自組織の情報を更新
     * ログイン中のユーザーが属する組織の情報を更新します。
     * @param requestBody
     * @returns OrganizationResponse OK
     * @throws ApiError
     */
    public static putApiAdminOrganization(
        requestBody?: AdminUpdateOrganizationRequest,
    ): CancelablePromise<OrganizationResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/organization',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                409: `Conflict`,
                500: `Internal Server Error`,
            },
        });
    }
}
