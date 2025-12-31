/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackOfficeDeleteOrganizationRequest } from '../models/BackOfficeDeleteOrganizationRequest';
import type { BackOfficeOrganizationDetailResponse } from '../models/BackOfficeOrganizationDetailResponse';
import type { BackOfficeUpdateOrganizationRequest } from '../models/BackOfficeUpdateOrganizationRequest';
import type { CreateOrganizationRequest } from '../models/CreateOrganizationRequest';
import type { OrganizationWithAdminResponse } from '../models/OrganizationWithAdminResponse';
import type { PagedResponseOfBackOfficeOrganizationListItemResponse } from '../models/PagedResponseOfBackOfficeOrganizationListItemResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BackOfficeOrganizationsService {
    /**
     * 組織一覧を取得
     * @param page ページ番号
     * @param pageSize ページサイズ
     * @returns PagedResponseOfBackOfficeOrganizationListItemResponse OK
     * @throws ApiError
     */
    public static getApiBackofficeOrganizations(
        page?: number,
        pageSize?: number,
    ): CancelablePromise<PagedResponseOfBackOfficeOrganizationListItemResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backoffice/organizations',
            query: {
                'Page': page,
                'PageSize': pageSize,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * 組織登録（管理者ユーザーも同時作成）
     * 新規組織を登録し、管理者ユーザーを同時に作成します。
     * 管理者ユーザーへはパスワード設定メールが送信されます。
     * @param requestBody
     * @returns OrganizationWithAdminResponse OK
     * @throws ApiError
     */
    public static postApiBackofficeOrganizations(
        requestBody: CreateOrganizationRequest,
    ): CancelablePromise<OrganizationWithAdminResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backoffice/organizations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 組織詳細を取得
     * @param id
     * @returns BackOfficeOrganizationDetailResponse OK
     * @throws ApiError
     */
    public static getApiBackofficeOrganizations1(
        id: number,
    ): CancelablePromise<BackOfficeOrganizationDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backoffice/organizations/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * 組織を更新
     * @param id
     * @param requestBody
     * @returns BackOfficeOrganizationDetailResponse OK
     * @throws ApiError
     */
    public static putApiBackofficeOrganizations(
        id: number,
        requestBody: BackOfficeUpdateOrganizationRequest,
    ): CancelablePromise<BackOfficeOrganizationDetailResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/backoffice/organizations/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * 組織を削除（物理削除）
     * 組織とすべての関連データを物理削除します。
     * 誤操作防止のため、確認用に組織名の入力が必要です。
     * @param id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static deleteApiBackofficeOrganizations(
        id: number,
        requestBody: BackOfficeDeleteOrganizationRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/backoffice/organizations/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
}
