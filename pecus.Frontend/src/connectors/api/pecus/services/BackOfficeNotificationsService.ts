/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackOfficeCreateNotificationRequest } from '../models/BackOfficeCreateNotificationRequest';
import type { BackOfficeDeleteNotificationRequest } from '../models/BackOfficeDeleteNotificationRequest';
import type { BackOfficeNotificationDetailResponse } from '../models/BackOfficeNotificationDetailResponse';
import type { BackOfficeUpdateNotificationRequest } from '../models/BackOfficeUpdateNotificationRequest';
import type { PagedResponseOfBackOfficeNotificationListItemResponse } from '../models/PagedResponseOfBackOfficeNotificationListItemResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BackOfficeNotificationsService {
    /**
     * システム通知一覧を取得
     * @param page ページ番号
     * @param pageSize ページサイズ
     * @param includeDeleted 削除済みを含めるか
     * @returns PagedResponseOfBackOfficeNotificationListItemResponse OK
     * @throws ApiError
     */
    public static getApiBackofficeNotifications(
        page?: number,
        pageSize?: number,
        includeDeleted?: boolean,
    ): CancelablePromise<PagedResponseOfBackOfficeNotificationListItemResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backoffice/notifications',
            query: {
                'Page': page,
                'PageSize': pageSize,
                'IncludeDeleted': includeDeleted,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * システム通知を作成
     * @param requestBody
     * @returns BackOfficeNotificationDetailResponse Created
     * @throws ApiError
     */
    public static postApiBackofficeNotifications(
        requestBody: BackOfficeCreateNotificationRequest,
    ): CancelablePromise<BackOfficeNotificationDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backoffice/notifications',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * システム通知詳細を取得
     * @param id
     * @returns BackOfficeNotificationDetailResponse OK
     * @throws ApiError
     */
    public static getApiBackofficeNotifications1(
        id: number,
    ): CancelablePromise<BackOfficeNotificationDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backoffice/notifications/{id}',
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
     * システム通知を更新（公開前のみ）
     * @param id
     * @param requestBody
     * @returns BackOfficeNotificationDetailResponse OK
     * @throws ApiError
     */
    public static putApiBackofficeNotifications(
        id: number,
        requestBody: BackOfficeUpdateNotificationRequest,
    ): CancelablePromise<BackOfficeNotificationDetailResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/backoffice/notifications/{id}',
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
     * システム通知を削除
     * 論理削除を行います。配信済みのメッセージも削除するかどうかを指定できます。
     * @param id
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static deleteApiBackofficeNotifications(
        id: number,
        requestBody: BackOfficeDeleteNotificationRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/backoffice/notifications/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
}
