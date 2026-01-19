/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaExceptionResponse } from '../models/AgendaExceptionResponse';
import type { AgendaOccurrenceResponse } from '../models/AgendaOccurrenceResponse';
import type { AgendaOccurrencesResponse } from '../models/AgendaOccurrencesResponse';
import type { AgendaResponse } from '../models/AgendaResponse';
import type { CancelAgendaRequest } from '../models/CancelAgendaRequest';
import type { CreateAgendaExceptionRequest } from '../models/CreateAgendaExceptionRequest';
import type { CreateAgendaRequest } from '../models/CreateAgendaRequest';
import type { UpdateAgendaExceptionRequest } from '../models/UpdateAgendaExceptionRequest';
import type { UpdateAgendaRequest } from '../models/UpdateAgendaRequest';
import type { UpdateAttendanceRequest } from '../models/UpdateAttendanceRequest';
import type { UpdateFromOccurrenceRequest } from '../models/UpdateFromOccurrenceRequest';
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
     * 展開済みオカレンス一覧取得（期間指定）
     * 繰り返しイベントを展開し、各オカレンス（回）を個別に返します。
     * 例外（特定回の中止・変更）も反映されます。
     * @param startAt
     * @param endAt
     * @returns AgendaOccurrenceResponse OK
     * @throws ApiError
     */
    public static getApiAgendasOccurrences(
        startAt?: string,
        endAt?: string,
    ): CancelablePromise<Array<AgendaOccurrenceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agendas/occurrences',
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
     * 直近の展開済みオカレンス一覧取得
     * 繰り返しイベントを展開し、直近の各オカレンス（回）を個別に返します。
     * タイムライン表示用に最適化されています。
     * カーソルベースのページネーションに対応しています。
     * @param limit
     * @param cursor
     * @returns AgendaOccurrencesResponse OK
     * @throws ApiError
     */
    public static getApiAgendasOccurrencesRecent(
        limit: number = 20,
        cursor?: string,
    ): CancelablePromise<AgendaOccurrencesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agendas/occurrences/recent',
            query: {
                'limit': limit,
                'cursor': cursor,
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
     * アジェンダ更新（シリーズ全体）
     * @param id
     * @param requestBody
     * @returns AgendaResponse OK
     * @throws ApiError
     */
    public static putApiAgendas(
        id: number,
        requestBody: UpdateAgendaRequest,
    ): CancelablePromise<AgendaResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/agendas/{id}',
            path: {
                'id': id,
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
     * 「この回以降」更新（シリーズ分割）
     * 指定された回を境にシリーズを分割します。
     * 元のシリーズは分割地点の前の回で終了し、新しいシリーズが作成されます。
     * 戻り値は新しく作成されたシリーズのアジェンダです。
     * @param id
     * @param requestBody
     * @returns AgendaResponse Created
     * @throws ApiError
     */
    public static putApiAgendasFrom(
        id: number,
        requestBody: UpdateFromOccurrenceRequest,
    ): CancelablePromise<AgendaResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/agendas/{id}/from',
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
     * アジェンダ中止（シリーズ全体）
     * 物理削除ではなく中止状態にします。中止されたアジェンダは一覧に表示されますが、
     * 中止理由と共に視覚的に区別されます。
     * @param id
     * @param requestBody
     * @returns AgendaResponse OK
     * @throws ApiError
     */
    public static patchApiAgendasCancel(
        id: number,
        requestBody: CancelAgendaRequest,
    ): CancelablePromise<AgendaResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/agendas/{id}/cancel',
            path: {
                'id': id,
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
     * 参加状況更新
     * 現在のユーザーの参加状況を更新します。
     * @param id
     * @param requestBody
     * @returns AgendaResponse OK
     * @throws ApiError
     */
    public static patchApiAgendasAttendance(
        id: number,
        requestBody: UpdateAttendanceRequest,
    ): CancelablePromise<AgendaResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/agendas/{id}/attendance',
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
     * アジェンダ例外一覧取得
     * 指定されたアジェンダの全例外（特定回の中止・変更）を取得します。
     * @param id
     * @returns AgendaExceptionResponse OK
     * @throws ApiError
     */
    public static getApiAgendasExceptions(
        id: number,
    ): CancelablePromise<Array<AgendaExceptionResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/agendas/{id}/exceptions',
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
     * アジェンダ例外作成（特定回の中止・変更）
     * 繰り返しアジェンダの特定回を中止または変更します。
     * 単発イベントには使用できません。シリーズ全体の変更は PUT を使用してください。
     * @param id
     * @param requestBody
     * @returns AgendaExceptionResponse Created
     * @throws ApiError
     */
    public static postApiAgendasExceptions(
        id: number,
        requestBody: CreateAgendaExceptionRequest,
    ): CancelablePromise<AgendaExceptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/agendas/{id}/exceptions',
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
     * アジェンダ例外更新
     * 既存の例外（特定回の中止・変更）を更新します。
     * @param id
     * @param exceptionId
     * @param requestBody
     * @returns AgendaExceptionResponse OK
     * @throws ApiError
     */
    public static putApiAgendasExceptions(
        id: number,
        exceptionId: number,
        requestBody: UpdateAgendaExceptionRequest,
    ): CancelablePromise<AgendaExceptionResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/agendas/{id}/exceptions/{exceptionId}',
            path: {
                'id': id,
                'exceptionId': exceptionId,
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
     * アジェンダ例外削除（元に戻す）
     * 例外を削除し、特定回を元の設定に戻します。
     * 中止していた回の中止を取り消す、または変更していた回を元に戻す場合に使用します。
     * @param id
     * @param exceptionId
     * @returns void
     * @throws ApiError
     */
    public static deleteApiAgendasExceptions(
        id: number,
        exceptionId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/agendas/{id}/exceptions/{exceptionId}',
            path: {
                'id': id,
                'exceptionId': exceptionId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
