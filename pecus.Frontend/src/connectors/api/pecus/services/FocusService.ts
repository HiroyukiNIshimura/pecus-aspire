/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FocusRecommendationResponse } from '../models/FocusRecommendationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FocusService {
    /**
     * 自分のフォーカス推奨タスクを取得
     * @returns FocusRecommendationResponse OK
     * @throws ApiError
     */
    public static getApiFocusMe(): CancelablePromise<FocusRecommendationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/focus/me',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
