/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrganizationResponse } from './OrganizationResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type OrganizationResponseConcurrencyErrorResponse = {
    /**
     * HTTPステータスコード
     */
    statusCode?: number;
    /**
     * エラーメッセージ
     */
    message: string;
    /**
     * エラー詳細（オプション）
     */
    details?: string | null;
    current?: OrganizationResponse;
};

