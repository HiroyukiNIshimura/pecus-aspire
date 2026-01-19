/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaResponse } from '../models/AgendaResponse';
import type { CreateAgendaRequest } from '../models/CreateAgendaRequest';
import type { UpdateAgendaRequest } from '../models/UpdateAgendaRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AgendaService {
    /**
     * アジェンダ一覧取得（期間指定）
     * @param startAt
     * @param endAt
     * @returns AgendaResponse OK
     * @throws ApiError
     */
    public static getApiAgendas(
        startAt?: string,
        endAt?: string,
    ): CancelablePromise<Array<AgendaResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agendas',
            query: {
                'startAt': startAt,
                'endAt': endAt,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * アジェンダ作成
     * @param requestBody
     * @returns AgendaResponse Created
     * @throws ApiError
     */
    public static postApiAgendas(
        requestBody: CreateAgendaRequest,
    ): CancelablePromise<AgendaResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/agendas',
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
     * 直近のアジェンダ一覧取得
     * @param limit
     * @returns AgendaResponse OK
     * @throws ApiError
     */
    public static getApiAgendasRecent(
        limit: number = 20,
    ): CancelablePromise<Array<AgendaResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agendas/recent',
            query: {
                'limit': limit,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * アジェンダ詳細取得
     * @param id
     * @returns AgendaResponse OK
     * @throws ApiError
     */
    public static getApiAgendas1(
        id: number,
    ): CancelablePromise<AgendaResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agendas/{id}',
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
     * アジェンダ更新
     * @param id
     * @param requestBody
     * @param organizationId
     * @returns AgendaResponse OK
     * @throws ApiError
     */
    public static putApiAgendas(
        id: number,
        requestBody: UpdateAgendaRequest,
        organizationId?: number,
    ): CancelablePromise<AgendaResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/agendas/{id}',
            path: {
                'id': id,
            },
            query: {
                'organizationId': organizationId,
            },
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
    /**
     * アジェンダ削除
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiAgendas(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/agendas/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
