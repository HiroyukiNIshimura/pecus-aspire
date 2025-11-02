/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateGenreRequest } from '../models/CreateGenreRequest';
import type { GenreDetailResponse } from '../models/GenreDetailResponse';
import type { GenreListItemResponsePagedResponse } from '../models/GenreListItemResponsePagedResponse';
import type { GenreResponse } from '../models/GenreResponse';
import type { SetActiveStatusRequest } from '../models/SetActiveStatusRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UpdateGenreRequest } from '../models/UpdateGenreRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BackendGenreService {
    /**
     * ジャンル一覧を取得
     * @param page
     * @param activeOnly
     * @returns GenreListItemResponsePagedResponse OK
     * @throws ApiError
     */
    public static getApiBackendGenres(
        page?: number,
        activeOnly?: boolean,
    ): CancelablePromise<GenreListItemResponsePagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backend/genres',
            query: {
                'Page': page,
                'ActiveOnly': activeOnly,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ジャンルを作成
     * @param requestBody ジャンル作成リクエスト
     * @returns GenreResponse OK
     * @throws ApiError
     */
    public static postApiBackendGenres(
        requestBody?: CreateGenreRequest,
    ): CancelablePromise<GenreResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backend/genres',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ジャンル詳細を取得
     * @param id ジャンルID
     * @returns GenreDetailResponse OK
     * @throws ApiError
     */
    public static getApiBackendGenres1(
        id: number,
    ): CancelablePromise<GenreDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backend/genres/{id}',
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
     * ジャンルを更新
     * @param id ジャンルID
     * @param requestBody ジャンル更新リクエスト
     * @returns GenreResponse OK
     * @throws ApiError
     */
    public static putApiBackendGenres(
        id: number,
        requestBody?: UpdateGenreRequest,
    ): CancelablePromise<GenreResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/backend/genres/{id}',
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
     * ジャンルを削除
     * @param id ジャンルID
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiBackendGenres(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/backend/genres/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ジャンルのアクティブ状態を設定
     * @param id ジャンルID
     * @param requestBody アクティブ状態設定リクエスト
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static putApiBackendGenresActiveStatus(
        id: number,
        requestBody?: SetActiveStatusRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/backend/genres/{id}/active-status',
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
}
