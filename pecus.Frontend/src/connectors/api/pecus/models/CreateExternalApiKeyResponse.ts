/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * APIキー発行直後のレスポンス。
 * 平文キー（RawKey）はこの応答でのみ取得可能。
 */
export type CreateExternalApiKeyResponse = {
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
     * 平文APIキー（この応答でのみ取得可能）
     */
    rawKey: string;
    /**
     * 有効期限
     */
    expiresAt: string;
    /**
     * 作成日時
     */
    createdAt: string;
};

