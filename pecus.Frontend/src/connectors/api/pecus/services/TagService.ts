/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTagRequest } from '../models/CreateTagRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { TagDetailResponse } from '../models/TagDetailResponse';
import type { TagResponse } from '../models/TagResponse';
import type { UpdateTagRequest } from '../models/UpdateTagRequest';
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
    /**
     * タグ更新
     * @param tagId
     * @param requestBody
     * @returns TagResponse OK
     * @throws ApiError
     */
    public static putApiTags(
        tagId: number,
        requestBody?: UpdateTagRequest,
    ): CancelablePromise<TagResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/tags/{tagId}',
            path: {
                'tagId': tagId,
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
     * タグ削除
     * @param tagId
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiTags(
        tagId: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/tags/{tagId}',
            path: {
                'tagId': tagId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
