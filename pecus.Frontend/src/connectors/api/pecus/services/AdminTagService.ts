/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTagRequest } from '../models/CreateTagRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { TagDetailResponse } from '../models/TagDetailResponse';
import type { TagListItemResponseObjectPagedResponse } from '../models/TagListItemResponseObjectPagedResponse';
import type { TagResponse } from '../models/TagResponse';
import type { UpdateTagRequest } from '../models/UpdateTagRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminTagService {
    /**
     * タグ登録
     * @param requestBody
     * @returns TagResponse OK
     * @throws ApiError
     */
    public static postApiAdminTags(
        requestBody?: CreateTagRequest,
    ): CancelablePromise<TagResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/tags',
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
     * タグ一覧取得（ページネーション）
     * @param page ページ番号
     * @param isActive アクティブ状態フィルター
     * @returns TagListItemResponseObjectPagedResponse OK
     * @throws ApiError
     */
    public static getApiAdminTags(
        page?: number,
        isActive?: boolean,
    ): CancelablePromise<TagListItemResponseObjectPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/tags',
            query: {
                'Page': page,
                'IsActive': isActive,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * タグ情報取得
     * @param id
     * @returns TagDetailResponse OK
     * @throws ApiError
     */
    public static getApiAdminTags1(
        id: number,
    ): CancelablePromise<TagDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/tags/{id}',
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
     * タグ更新
     * @param id
     * @param requestBody
     * @returns TagResponse OK
     * @throws ApiError
     */
    public static putApiAdminTags(
        id: number,
        requestBody?: UpdateTagRequest,
    ): CancelablePromise<TagResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/tags/{id}',
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
     * タグ削除
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiAdminTags(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/tags/{id}',
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
     * タグ無効化
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static patchApiAdminTagsDeactivate(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/tags/{id}/deactivate',
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
     * タグ有効化
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static patchApiAdminTagsActivate(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/tags/{id}/activate',
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
