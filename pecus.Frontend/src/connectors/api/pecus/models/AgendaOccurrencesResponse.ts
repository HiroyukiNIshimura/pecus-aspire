/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaOccurrenceResponse } from './AgendaOccurrenceResponse';
/**
 * アジェンダオカレンス一覧レスポンス（ページネーション対応）
 */
export type AgendaOccurrencesResponse = {
    /**
     * オカレンス一覧
     */
    items: Array<AgendaOccurrenceResponse>;
    /**
     * 次ページカーソル（最後のオカレンスのStartAt、null の場合は最後のページ）
     */
    nextCursor?: string | null;
    /**
     * さらにオカレンスがあるか
     */
    hasMore?: boolean;
};

