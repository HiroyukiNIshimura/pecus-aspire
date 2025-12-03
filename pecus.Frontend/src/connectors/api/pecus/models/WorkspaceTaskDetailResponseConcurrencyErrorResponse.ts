/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceTaskDetailResponse } from './WorkspaceTaskDetailResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type WorkspaceTaskDetailResponseConcurrencyErrorResponse = {
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
    current?: WorkspaceTaskDetailResponse;
};

