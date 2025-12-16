/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrganizationSettingResponse } from './OrganizationSettingResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type ConcurrencyErrorResponseOfOrganizationSettingResponse = {
    current?: (null | OrganizationSettingResponse);
    /**
     * HTTPステータスコード
     */
    statusCode?: number | string;
    /**
     * エラーメッセージ
     */
    message: string;
    /**
     * エラー詳細（オプション）
     */
    details?: string | null;
};

