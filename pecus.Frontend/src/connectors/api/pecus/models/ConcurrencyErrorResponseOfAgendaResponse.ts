/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaResponse } from './AgendaResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type ConcurrencyErrorResponseOfAgendaResponse = {
    current?: AgendaResponse | null;
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

