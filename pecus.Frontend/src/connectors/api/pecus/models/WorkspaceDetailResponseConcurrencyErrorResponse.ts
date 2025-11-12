/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceDetailResponse } from './WorkspaceDetailResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type WorkspaceDetailResponseConcurrencyErrorResponse = {
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
    current?: WorkspaceDetailResponse;
};

