/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MasterGenreResponse } from '../models/MasterGenreResponse';
import type { MasterSkillResponse } from '../models/MasterSkillResponse';
import type { RoleResponse } from '../models/RoleResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MasterService {
    /**
     * アクティブなジャンル一覧を取得
     * @returns MasterGenreResponse OK
     * @throws ApiError
     */
    public static getApiMasterGenres(): CancelablePromise<Array<MasterGenreResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/master/genres',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ログインユーザーの属する組織のアクティブなスキル一覧を取得
     * @returns MasterSkillResponse OK
     * @throws ApiError
     */
    public static getApiMasterSkills(): CancelablePromise<Array<MasterSkillResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/master/skills',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ロール一覧を取得
     * @returns RoleResponse OK
     * @throws ApiError
     */
    public static getApiMasterRoles(): CancelablePromise<Array<RoleResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/master/roles',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}
