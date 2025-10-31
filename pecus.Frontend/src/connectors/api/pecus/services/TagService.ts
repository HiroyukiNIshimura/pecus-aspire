/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTagRequest } from '../models/CreateTagRequest';
import type { TagDetailResponse } from '../models/TagDetailResponse';
import type { TagResponse } from '../models/TagResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TagService {
    /**
     * タグ作成
     * @param requestBody
     * @returns TagResponse OK
     * @throws ApiError
     */
    public static postApiTags(
        requestBody?: CreateTagRequest,
    ): CancelablePromise<TagResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/tags',
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
     * 組織のタグ一覧取得
     * @returns TagDetailResponse OK
     * @throws ApiError
     */
    public static getApiTags(): CancelablePromise<Array<TagDetailResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tags',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
