/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CurrentUserInfo } from './CurrentUserInfo';
import type { LimitsSettings } from './LimitsSettings';
import type { OrganizationPublicSettings } from './OrganizationPublicSettings';
import type { UserPublicSettings } from './UserPublicSettings';
/**
 * アプリケーション公開設定レスポンス
 * フロントエンドで利用可能な組織設定とユーザー設定を統合したDTO
 * ※ APIキー、パスワード等のセンシティブ情報は含まない
 */
export type AppPublicSettingsResponse = {
    currentUser: CurrentUserInfo;
    organization: OrganizationPublicSettings;
    user: UserPublicSettings;
    limits: LimitsSettings;
};

