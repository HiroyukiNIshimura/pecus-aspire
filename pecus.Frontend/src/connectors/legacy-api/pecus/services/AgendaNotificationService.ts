/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaNotificationCountResponse } from '../models/AgendaNotificationCountResponse';
import type { AgendaNotificationResponse } from '../models/AgendaNotificationResponse';
import type { MarkNotificationsReadRequest } from '../models/MarkNotificationsReadRequest';
import type { MarkNotificationsReadResponse } from '../models/MarkNotificationsReadResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AgendaNotificationService {
    /**
     * 通知一覧取得
     * @param limit 取得件数（1〜100、省略時はデフォルトページサイズ）
     * @param beforeId このID以前の通知を取得（ページング用）
     * @param unreadOnly 未読のみ取得
     * @returns AgendaNotificationResponse OK
     * @throws ApiError
     */
    public static getApiAgendasNotifications(
        limit?: number,
        beforeId?: number,
        unreadOnly?: boolean,
    ): CancelablePromise<Array<AgendaNotificationResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agendas/notifications',
            query: {
                'Limit': limit,
                'BeforeId': beforeId,
                'UnreadOnly': unreadOnly,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 未読通知件数取得（ヘッダーバッジ用）
     * @returns AgendaNotificationCountResponse OK
     * @throws ApiError
     */
    public static getApiAgendasNotificationsCount(): CancelablePromise<AgendaNotificationCountResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agendas/notifications/count',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 通知を既読にする（個別）
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static postApiAgendasNotificationsRead(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/agendas/notifications/{id}/read',
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
     * 通知を一括既読にする
     * notificationIdsを指定した場合は指定した通知のみ、
     * 指定しない場合は全ての未読通知を既読にします。
     * @param requestBody
     * @returns MarkNotificationsReadResponse OK
     * @throws ApiError
     */
    public static postApiAgendasNotificationsRead1(
        requestBody: MarkNotificationsReadRequest,
    ): CancelablePromise<MarkNotificationsReadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/agendas/notifications/read',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
