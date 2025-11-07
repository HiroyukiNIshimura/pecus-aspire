/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackendUpdateOrganizationRequest } from '../models/BackendUpdateOrganizationRequest';
import type { DeleteOrganizationRequest } from '../models/DeleteOrganizationRequest';
import type { OrganizationDetailResponse } from '../models/OrganizationDetailResponse';
import type { OrganizationListItemResponsePagedResponse } from '../models/OrganizationListItemResponsePagedResponse';
import type { OrganizationResponse } from '../models/OrganizationResponse';
import type { SetOrganizationActiveStatusRequest } from '../models/SetOrganizationActiveStatusRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UserListItemResponse } from '../models/UserListItemResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BackendOrganizationService {
    /**
     * 組織情報取得
     * @param id
     * @returns OrganizationDetailResponse OK
     * @throws ApiError
     */
    public static getApiBackendOrganizations(
        id: number,
    ): CancelablePromise<OrganizationDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backend/organizations/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 組織更新
     * @param id
     * @param requestBody
     * @returns OrganizationResponse OK
     * @throws ApiError
     */
    public static putApiBackendOrganizations(
        id: number,
        requestBody?: BackendUpdateOrganizationRequest,
    ): CancelablePromise<OrganizationResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/backend/organizations/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 組織削除
     * @param id
     * @param requestBody
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiBackendOrganizations(
        id: number,
        requestBody?: DeleteOrganizationRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/backend/organizations/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 組織一覧取得（ページネーション対応）
     * @param page
     * @param activeOnly
     * @returns OrganizationListItemResponsePagedResponse OK
     * @throws ApiError
     */
    public static getApiBackendOrganizations1(
        page?: number,
        activeOnly?: boolean,
    ): CancelablePromise<OrganizationListItemResponsePagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backend/organizations',
            query: {
                'Page': page,
                'ActiveOnly': activeOnly,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 組織の所属ユーザー取得
     * @param id
     * @returns UserListItemResponse OK
     * @throws ApiError
     */
    public static getApiBackendOrganizationsUsers(
        id: number,
    ): CancelablePromise<Array<UserListItemResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backend/organizations/{id}/users',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 組織のアクティブ状態を設定
     * @param id 組織ID
     * @param requestBody アクティブ状態設定リクエスト
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static putApiBackendOrganizationsActiveStatus(
        id: number,
        requestBody?: SetOrganizationActiveStatusRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/backend/organizations/{id}/active-status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
