/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageResponse } from '../models/MessageResponse';
import type { SetOwnSkillsRequest } from '../models/SetOwnSkillsRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UpdatePasswordRequest } from '../models/UpdatePasswordRequest';
import type { UpdateProfileRequest } from '../models/UpdateProfileRequest';
import type { UpdateUserSettingRequest } from '../models/UpdateUserSettingRequest';
import type { UserDetailResponse } from '../models/UserDetailResponse';
import type { UserSettingResponse } from '../models/UserSettingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfileService {
    /**
     * 自分のプロフィール情報を取得
     * ユーザーの基本情報（ユーザー名、アバター、スキル、ロール等）を取得します。
     * @returns UserDetailResponse OK
     * @throws ApiError
     */
    public static getApiProfile(): CancelablePromise<UserDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 自分のプロフィール情報を更新
     * ユーザーが自身のプロフィール（ユーザー名、アバタータイプ、アバターURL）を更新します。
     * スキル変更は別エンドポイント（PUT /api/profile/skills）で実施してください。
     * @param requestBody 更新情報
     * @returns UserDetailResponse OK
     * @throws ApiError
     */
    public static putApiProfile(
        requestBody?: UpdateProfileRequest,
    ): CancelablePromise<UserDetailResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/profile',
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
     * 自分のユーザー設定を更新
     * メール受信可否など、個人の設定を更新します。
     * @param requestBody 設定更新リクエスト
     * @returns UserSettingResponse OK
     * @throws ApiError
     */
    public static putApiProfileSetting(
        requestBody?: UpdateUserSettingRequest,
    ): CancelablePromise<UserSettingResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/profile/setting',
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
     * 自分のスキルを設定
     * ユーザーが自身のスキルを設定します（洗い替え）。
     * 指定されたスキル以外のスキルは削除されます。
     * @param requestBody スキルIDのリスト
     * @returns SuccessResponse スキルを設定しました
     * @throws ApiError
     */
    public static putApiProfileSkills(
        requestBody?: SetOwnSkillsRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/profile/skills',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが無効です`,
                404: `ユーザーが見つかりません`,
                409: `競合: スキル情報が別のユーザーにより更新されています`,
            },
        });
    }
    /**
     * パスワードを変更
     * ユーザーが自身のパスワードを変更します。重要なセキュリティ変更です。
     * 現在のパスワードの確認（古いパスワード）が必須です。
     * @param requestBody 変更情報
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static patchApiProfilePassword(
        requestBody?: UpdatePasswordRequest,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/profile/password',
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
