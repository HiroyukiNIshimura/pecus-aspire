/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemDetailResponse } from './WorkspaceItemDetailResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type ConcurrencyErrorResponseOfWorkspaceItemDetailResponse = {
    current?: WorkspaceItemDetailResponse | null;
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
};

