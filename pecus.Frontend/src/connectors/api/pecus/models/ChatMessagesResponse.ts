/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageItem } from './ChatMessageItem';
/**
 * メッセージ一覧レスポンス
 */
export type ChatMessagesResponse = {
    /**
     * メッセージ一覧
     */
    messages: Array<ChatMessageItem>;
    /**
     * 次ページカーソル（null の場合は最後のページ）
     */
    nextCursor?: number | null;
    /**
     * さらにメッセージがあるか
     */
    hasMore?: boolean;
};

