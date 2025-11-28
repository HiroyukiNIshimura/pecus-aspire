/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserWithoutPasswordRequest } from '../models/CreateUserWithoutPasswordRequest';
import type { RoleListItemResponse } from '../models/RoleListItemResponse';
import type { SetUserActiveStatusRequest } from '../models/SetUserActiveStatusRequest';
import type { SetUserRolesRequest } from '../models/SetUserRolesRequest';
import type { SetUserSkillsRequest } from '../models/SetUserSkillsRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UserDetailResponse } from '../models/UserDetailResponse';
import type { UserDetailResponseUserStatisticsPagedResponse } from '../models/UserDetailResponseUserStatisticsPagedResponse';
import type { UserSearchResultResponse } from '../models/UserSearchResultResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminUserService {
    /**
     * 個別ユーザー情報を取得
     * 指定したユーザーの詳細情報を取得します。組織内のユーザーのみ取得可能です。
     * @param id ユーザーID
     * @returns UserDetailResponse ユーザー情報を返します
     * @throws ApiError
     */
    public static getApiAdminUsers(
        id: number,
    ): CancelablePromise<UserDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `他組織のユーザーは取得できません`,
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
     * 組織内のユーザー一覧を取得（ページング）
     * ログインユーザーの組織に所属するユーザーの一覧をページングで取得します。
     * @param page
     * @param pageSize
     * @param isActive アクティブなユーザーのみ取得するか（null: 全て、true: アクティブのみ、false: 非アクティブのみ）
     * @param username ユーザー名による前方一致検索（オプション）
     * @param skillIds スキルIDで絞り込み（指定されたスキルを持つユーザーのみを検索）
     * @param skillFilterMode スキルフィルターのモード（"and": すべてのスキルを保有、"or": いずれかのスキルを保有）
     * デフォルトは "and"
     * @returns UserDetailResponseUserStatisticsPagedResponse ユーザー一覧を返します
     * @throws ApiError
     */
    public static getApiAdminUsers1(
        page?: number,
        pageSize?: number,
        isActive?: boolean,
        username?: string,
        skillIds?: Array<number>,
        skillFilterMode?: string,
    ): CancelablePromise<UserDetailResponseUserStatisticsPagedResponse> {
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
                409: `Conflict`,
            },
        });
    }
    /**
     * ユーザーのスキルを設定（管理者が他のユーザーのスキルを管理）
     *
     * 管理者が組織内のユーザーのスキルを設定します（洗い替え）。
     * 指定されたスキル以外は削除されます。
     *
     * <strong>重要</strong>：このエンドポイントは管理者による操作であり、
     * ユーザーが自身のスキルを変更する場合は PUT /api/profile/skills を使用してください。
     * @param id 対象ユーザーID
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
                409: `競合: スキル情報が別のユーザーにより更新されています`,
            },
        });
    }
    /**
     * パスワードなしでユーザーを作成
     * ユーザー名とメールアドレスのみでユーザーを作成します。パスワードは後で設定されます。
     * 作成されたユーザーにはパスワード設定用のトークンが発行され、メールで通知されます。
     * @param requestBody ユーザー作成リクエスト
     * @returns UserDetailResponse ユーザーが作成されました
     * @throws ApiError
     */
    public static postApiAdminUsersCreateWithoutPassword(
        requestBody?: CreateUserWithoutPasswordRequest,
    ): CancelablePromise<UserDetailResponse> {
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
    /**
     * ユーザーのロールを設定（管理者が他のユーザーのロールを管理）
     *
     * 管理者が組織内のユーザーのロールを設定します（洗い替え）。
     * 指定されたロール以外は削除されます。
     *
     * <strong>重要</strong>：このエンドポイントは管理者による操作です。
     * ユーザーのロールはシステム管理者によってのみ変更されるべきです。
     * @param id 対象ユーザーID
     * @param requestBody ロールIDのリスト
     * @returns SuccessResponse ロールを設定しました
     * @throws ApiError
     */
    public static putApiAdminUsersRoles(
        id: number,
        requestBody?: SetUserRolesRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/users/{id}/roles',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `他組織のユーザーは操作できません`,
                404: `ユーザーが見つかりません`,
                409: `競合: ロール情報が別のユーザーにより更新されています`,
            },
        });
    }
    /**
     * 全ロール一覧を取得
     * システム内の全ロール一覧を取得します。ユーザー設定画面で使用されます。
     * @returns RoleListItemResponse ロール一覧を返します
     * @throws ApiError
     */
    public static getApiAdminUsersRoles(): CancelablePromise<Array<RoleListItemResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/users/roles',
        });
    }
    /**
     * ユーザーをあいまい検索
     * ユーザー名またはメールアドレスであいまい検索を行います。
     * pgroonga を使用しているため、日本語の漢字のゆらぎやタイポにも対応します。
     * ワークスペースへのメンバー追加時などに使用します。
     * @param q 検索クエリ（2文字以上）
     * @param limit 取得件数上限（デフォルト20、最大50）
     * @returns UserSearchResultResponse 検索結果を返します
     * @throws ApiError
     */
    public static getApiAdminUsersSearch(
        q?: string,
        limit: number = 20,
    ): CancelablePromise<Array<UserSearchResultResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/users/search',
            query: {
                'q': q,
                'limit': limit,
            },
            errors: {
                400: `検索クエリが短すぎます`,
            },
        });
    }
}
