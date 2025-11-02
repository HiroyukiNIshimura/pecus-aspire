/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleInfoResponse } from './RoleInfoResponse';
/**
 * ログインレスポンス
 */
export type LoginResponse = {
    /**
     * JWTアクセストークン
     */
    accessToken: string | null;
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
    loginId: string | null;
    /**
     * ユーザー名
     */
    username: string | null;
    /**
     * メールアドレス
     */
    email: string | null;
    /**
     * アバタータイプ
     */
    avatarType?: string | null;
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
};

