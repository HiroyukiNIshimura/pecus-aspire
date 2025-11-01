/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserWithoutPasswordRequest } from '../models/CreateUserWithoutPasswordRequest';
import type { SetUserActiveStatusRequest } from '../models/SetUserActiveStatusRequest';
import type { SetUserSkillsRequest } from '../models/SetUserSkillsRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UserResponse } from '../models/UserResponse';
import type { UserResponseUserStatisticsPagedResponse } from '../models/UserResponseUserStatisticsPagedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminUserService {
    /**
     * 組織内のユーザー一覧を取得（ページング）
     * ログインユーザーの組織に所属するユーザーの一覧をページングで取得します。
     * @param page
     * @param pageSize
     * @param isActive アクティブなユーザーのみ取得するか（null: 全て、true: アクティブのみ、false: 非アクティブのみ）
     * @param username ユーザー名による前方一致検索（オプション）
     * @param skillIds スキルIDで絞り込み（指定されたスキルを持つユーザーのみを検索）
     * @param skillFilterMode スキルフィルターのモード（"and": すべてのスキルを保有、"or": いずれかのスキルを保有）
     * デフォルトは "and"
     * @returns UserResponseUserStatisticsPagedResponse ユーザー一覧を返します
     * @throws ApiError
     */
    public static getApiAdminUsers(
        page?: number,
        pageSize?: number,
        isActive?: boolean,
        username?: string,
        skillIds?: Array<number>,
        skillFilterMode?: string,
    ): CancelablePromise<UserResponseUserStatisticsPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/users',
            query: {
                'Page': page,
                'PageSize': pageSize,
                'IsActive': isActive,
                'Username': username,
                'SkillIds': skillIds,
                'SkillFilterMode': skillFilterMode,
            },
            errors: {
                404: `組織が見つかりません`,
            },
        });
    }
    /**
     * ユーザーのアクティブ状態を設定
     * 指定したユーザーのアクティブ状態を設定します。組織内のユーザーのみ操作可能です。
     * @param id ユーザーID
     * @param requestBody アクティブ状態設定リクエスト
     * @returns SuccessResponse ユーザーのアクティブ状態を設定しました
     * @throws ApiError
     */
    public static putApiAdminUsersActiveStatus(
        id: number,
        requestBody?: SetUserActiveStatusRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/users/{id}/active-status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `他組織のユーザーは操作できません`,
                404: `ユーザーが見つかりません`,
            },
        });
    }
    /**
     * ユーザーを削除
     * 指定したユーザーを削除します。組織内のユーザーのみ操作可能です。
     * @param id ユーザーID
     * @returns SuccessResponse ユーザーを削除しました
     * @throws ApiError
     */
    public static deleteApiAdminUsers(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `他組織のユーザーは操作できません`,
                404: `ユーザーが見つかりません`,
            },
        });
    }
    /**
     * ユーザーのスキルを設定
     * 指定したユーザーのスキルを設定します（洗い替え）。組織内のユーザーのみ操作可能です。
     * @param id ユーザーID
     * @param requestBody スキルIDのリスト
     * @returns SuccessResponse スキルを設定しました
     * @throws ApiError
     */
    public static putApiAdminUsersSkills(
        id: number,
        requestBody?: SetUserSkillsRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/users/{id}/skills',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `他組織のユーザーは操作できません`,
                404: `ユーザーが見つかりません`,
            },
        });
    }
    /**
     * パスワードなしでユーザーを作成
     * ユーザー名とメールアドレスのみでユーザーを作成します。パスワードは後で設定されます。
     * 作成されたユーザーにはパスワード設定用のトークンが発行され、メールで通知されます。
     * @param requestBody ユーザー作成リクエスト
     * @returns UserResponse ユーザーが作成されました
     * @throws ApiError
     */
    public static postApiAdminUsersCreateWithoutPassword(
        requestBody?: CreateUserWithoutPasswordRequest,
    ): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/users/create-without-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが無効です`,
                404: `組織が見つかりません`,
            },
        });
    }
    /**
     * ユーザーのパスワードリセットをリクエスト
     * 指定したユーザーのパスワードリセットをリクエストします。組織内のユーザーのみ操作可能です。
     * パスワードリセット用のメールがユーザーに送信されます。
     * @param id ユーザーID
     * @returns SuccessResponse パスワードリセットメールが送信されました
     * @throws ApiError
     */
    public static postApiAdminUsersRequestPasswordReset(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/users/{id}/request-password-reset',
            path: {
                'id': id,
            },
            errors: {
                403: `他組織のユーザーは操作できません`,
                404: `ユーザーが見つかりません`,
            },
        });
    }
}
