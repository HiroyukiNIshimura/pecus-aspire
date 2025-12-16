/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTagRequest } from '../models/CreateTagRequest';
import type { PagedResponseOfTagListItemResponseAndTagStatistics } from '../models/PagedResponseOfTagListItemResponseAndTagStatistics';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { TagDetailResponse } from '../models/TagDetailResponse';
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
        requestBody: CreateTagRequest,
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
     * タグの一覧をページネーションで取得します。
     * 統計情報として、タグのトータル件数、アクティブ/非アクティブ件数、
     * 利用されているトップ５タグ、利用されていないタグのリストを含みます。
     * @param page ページ番号
     * @param isActive アクティブ状態フィルター
     * @param unusedOnly 未使用のタグのみ取得するか（true: 未使用のみ、false または null: すべて）
     * @param name タグ名で前方一致検索（オプション）
     * @returns PagedResponseOfTagListItemResponseAndTagStatistics OK
     * @throws ApiError
     */
    public static getApiAdminTags(
        page?: number | string,
        isActive?: boolean,
        unusedOnly?: boolean,
        name?: string,
    ): CancelablePromise<PagedResponseOfTagListItemResponseAndTagStatistics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/tags',
            query: {
                'Page': page,
                'IsActive': isActive,
                'UnusedOnly': unusedOnly,
                'Name': name,
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
        id: number | string,
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
        id: number | string,
        requestBody: UpdateTagRequest,
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
                409: `Conflict`,
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
        id: number | string,
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
        id: number | string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/tags/{id}/deactivate',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                409: `Conflict`,
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
        id: number | string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/tags/{id}/activate',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                409: `Conflict`,
                500: `Internal Server Error`,
            },
        });
    }
}
