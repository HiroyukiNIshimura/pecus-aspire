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
     * 最終使用日時
     */
    lastUsedAt?: string | null;
    /**
     * 作成者ユーザーID
     */
    createdByUserId: number;
    /**
     * 作成日時
     */
    createdAt: string;
    /**
     * 有効期限切れかどうか
     */
    isExpired: boolean;
};

