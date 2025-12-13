/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvatarType } from './AvatarType';
import type { LandingPage } from './LandingPage';
import type { LoginDeviceInfo } from './LoginDeviceInfo';
import type { RoleInfoResponse } from './RoleInfoResponse';
/**
 * ログインレスポンス
 */
export type LoginResponse = {
    /**
     * JWTアクセストークン
     */
    accessToken: string;
    /**
     * トークンタイプ（常に "Bearer"）
     */
    tokenType?: string | null;
    /**
     * トークンの有効期限（UTC）
     */
    expiresAt?: string;
    /**
     * トークンの有効時間（秒）
     */
    expiresIn?: number;
    /**
     * ユーザーID
     */
    userId?: number;
    /**
     * ログインID
     */
    loginId: string;
    /**
     * ユーザー名
     */
    username: string;
    /**
     * メールアドレス
     */
    email: string;
    avatarType?: AvatarType;
    /**
     * アイデンティティアイコンURL
     */
    identityIconUrl?: string | null;
    /**
     * ユーザーが持つロール一覧
     */
    roles?: Array<RoleInfoResponse> | null;
    /**
     * リフレッシュトークン
     */
    refreshToken?: string | null;
    /**
     * リフレッシュトークンの有効期限（UTC）
     */
    refreshExpiresAt?: string | null;
    device?: LoginDeviceInfo;
    landingPage?: LandingPage;
};

