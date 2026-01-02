/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppPublicSettingsResponse } from '../models/AppPublicSettingsResponse';
import type { DeviceListResponse } from '../models/DeviceListResponse';
import type { DeviceResponse } from '../models/DeviceResponse';
import type { DeviceType } from '../models/DeviceType';
import type { EmailChangeRequestResponse } from '../models/EmailChangeRequestResponse';
import type { EmailChangeVerifyResponse } from '../models/EmailChangeVerifyResponse';
import type { MessageResponse } from '../models/MessageResponse';
import type { OSPlatform } from '../models/OSPlatform';
import type { PendingEmailChangeResponse } from '../models/PendingEmailChangeResponse';
import type { RequestEmailChangeRequest } from '../models/RequestEmailChangeRequest';
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
     * 自分の接続しているデバイス情報の一覧を取得
     * @returns DeviceResponse OK
     * @throws ApiError
     */
    public static getApiProfileDevices(): CancelablePromise<Array<DeviceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile/devices',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 自分の接続しているデバイス情報の一覧を取得（現在のデバイス判定付き）
     * @param deviceType デバイス種別
     * @param os OS
     * @param userAgent User-Agent
     * @returns DeviceListResponse OK
     * @throws ApiError
     */
    public static getApiProfileDevicesWithCurrent(
        deviceType?: DeviceType,
        os?: OSPlatform,
        userAgent?: string,
    ): CancelablePromise<DeviceListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile/devices/with-current',
            query: {
                'deviceType': deviceType,
                'os': os,
                'userAgent': userAgent,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 自分のデバイスを削除
     * @param deviceId デバイスID
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static deleteApiProfileDevices(
        deviceId: number,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profile/devices/{deviceId}',
            path: {
                'deviceId': deviceId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * メールアドレス変更をリクエスト
     * 新しいメールアドレスとパスワード（本人確認用）を送信します。
     * 確認メールが送信され、24時間有効なトークンが発行されます。
     * @param requestBody メールアドレス変更リクエスト
     * @returns EmailChangeRequestResponse 確認メールを送信しました
     * @throws ApiError
     */
    public static postApiProfileEmailRequestChange(
        requestBody: RequestEmailChangeRequest,
    ): CancelablePromise<EmailChangeRequestResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profile/email/request-change',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが無効です（パスワード不一致、重複メールアドレスなど）`,
                404: `ユーザーが見つかりません`,
                500: `サーバーエラー`,
            },
        });
    }
    /**
     * メールアドレス変更を確認（トークン検証）
     * 確認メールに記載されたトークンを検証し、メールアドレスを変更します。
     * トークンは24時間有効で、一度のみ使用可能です。
     * @param token 確認トークン（GUIDベース、32文字）
     * @returns EmailChangeVerifyResponse メールアドレスの変更が完了しました
     * @throws ApiError
     */
    public static getApiProfileEmailVerify(
        token?: string,
    ): CancelablePromise<EmailChangeVerifyResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile/email/verify',
            query: {
                'token': token,
            },
            errors: {
                400: `トークンが無効または期限切れです`,
                404: `ユーザーまたはトークンが見つかりません`,
                500: `サーバーエラー`,
            },
        });
    }
    /**
     * 未使用のメールアドレス変更トークン情報を取得
     * ユーザーの有効な（未使用かつ期限内の）メールアドレス変更トークン情報を取得します。
     * トークン本体は返しませんが、新しいメールアドレスと有効期限を確認できます。
     * @returns PendingEmailChangeResponse トークン情報を取得しました（存在する場合）
     * @throws ApiError
     */
    public static getApiProfileEmailPending(): CancelablePromise<PendingEmailChangeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile/email/pending',
            errors: {
                500: `サーバーエラー`,
            },
        });
    }
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
        requestBody: UpdateProfileRequest,
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
        requestBody: UpdateUserSettingRequest,
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
        requestBody: SetOwnSkillsRequest,
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
        requestBody: UpdatePasswordRequest,
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
    /**
     * アプリケーション公開設定を取得
     * フロントエンドで利用可能な現在のユーザー情報、組織設定、ユーザー設定を統合して返します。
     * APIキーやパスワード等のセンシティブ情報は含まれません。
     * SSRでレイアウトレベルで取得し、Context経由で配信することを想定しています。
     * @returns AppPublicSettingsResponse 公開設定を返します
     * @throws ApiError
     */
    public static getApiProfileAppSettings(): CancelablePromise<AppPublicSettingsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile/app-settings',
            errors: {
                404: `組織に所属していません`,
            },
        });
    }
}
