/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageResponse } from '../models/MessageResponse';
import type { UpdateEmailRequest } from '../models/UpdateEmailRequest';
import type { UpdateProfileRequest } from '../models/UpdateProfileRequest';
import type { UserResponse } from '../models/UserResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfileService {
    /**
     * 自分のプロフィール情報を取得
     * @returns UserResponse OK
     * @throws ApiError
     */
    public static getApiProfile(): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile',
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * 自分のプロフィール情報を更新
     * @param requestBody 更新情報
     * @returns any OK
     * @throws ApiError
     */
    public static putApiProfile(
        requestBody?: UpdateProfileRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/profile',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * メールアドレスを変更
     * @param requestBody 変更情報
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static patchApiProfileEmail(
        requestBody?: UpdateEmailRequest,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/profile/email',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
}
