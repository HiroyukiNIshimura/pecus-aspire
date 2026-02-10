/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * APIキー一覧用レスポンス
 */
export type ExternalApiKeyResponse = {
    /**
     * APIキーID
     */
    id: number;
    /**
     * キー名（用途識別用）
     */
    name: string;
    /**
     * キーの先頭8文字（識別用）
     */
    keyPrefix: string;
    /**
     * 有効期限
     */
    expiresAt: string;
    /**
     * 失効済みフラグ
     */
    isRevoked: boolean;
    /**
     * 作成者ユーザーID
     */
    createdByUserId: number;
    /**
     * 作成者ユーザー名
     */
    createdByUserName: string;
    /**
     * 作成日時
     */
    createdAt: string;
    /**
     * 失効者ユーザーID
     */
    revokedByUserId?: number | null;
    /**
     * 失効者ユーザー名
     */
    revokedByUserName?: string | null;
    /**
     * 失効日時
     */
    revokedAt?: string | null;
    /**
     * 有効期限切れかどうか
     */
    isExpired: boolean;
};

