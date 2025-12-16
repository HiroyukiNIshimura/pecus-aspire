/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskCommentDetailResponse } from './TaskCommentDetailResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type ConcurrencyErrorResponseOfTaskCommentDetailResponse = {
    current?: (null | TaskCommentDetailResponse);
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

