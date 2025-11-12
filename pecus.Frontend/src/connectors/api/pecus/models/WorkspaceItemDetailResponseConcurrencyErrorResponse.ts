/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemDetailResponse } from './WorkspaceItemDetailResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type WorkspaceItemDetailResponseConcurrencyErrorResponse = {
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
    current?: WorkspaceItemDetailResponse;
};

