/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSkillRequest } from '../models/CreateSkillRequest';
import type { SkillDetailResponse } from '../models/SkillDetailResponse';
import type { SkillListItemResponseObjectPagedResponse } from '../models/SkillListItemResponseObjectPagedResponse';
import type { SkillResponse } from '../models/SkillResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UpdateSkillRequest } from '../models/UpdateSkillRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminSkillService {
    /**
     * スキル登録
     * @param requestBody
     * @returns SkillResponse OK
     * @throws ApiError
     */
    public static postApiAdminSkills(
        requestBody?: CreateSkillRequest,
    ): CancelablePromise<SkillResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/skills',
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
     * スキル一覧取得（ページネーション）
     * @param page ページ番号（1から始まる）
     * @param isActive アクティブなスキルのみ取得するか
     * @returns SkillListItemResponseObjectPagedResponse OK
     * @throws ApiError
     */
    public static getApiAdminSkills(
        page?: number,
        isActive?: boolean,
    ): CancelablePromise<SkillListItemResponseObjectPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/skills',
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
     * スキル情報取得
     * @param id
     * @returns SkillDetailResponse OK
     * @throws ApiError
     */
    public static getApiAdminSkills1(
        id: number,
    ): CancelablePromise<SkillDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/skills/{id}',
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
     * スキル更新
     * @param id
     * @param requestBody
     * @returns SkillResponse OK
     * @throws ApiError
     */
    public static putApiAdminSkills(
        id: number,
        requestBody?: UpdateSkillRequest,
    ): CancelablePromise<SkillResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/skills/{id}',
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
     * スキル削除
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiAdminSkills(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/skills/{id}',
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
     * スキル無効化
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static patchApiAdminSkillsDeactivate(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/skills/{id}/deactivate',
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
     * スキル有効化
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static patchApiAdminSkillsActivate(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/skills/{id}/activate',
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
