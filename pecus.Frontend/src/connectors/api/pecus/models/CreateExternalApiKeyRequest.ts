/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * APIキー発行リクエスト
 */
export type CreateExternalApiKeyRequest = {
    /**
     * キー名（用途識別用）
     */
    name: string;
    /**
     * 有効期限（日数）。省略時は365日。
     */
    expirationDays?: number | null;
};

