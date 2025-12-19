/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageType } from './ChatMessageType';
/**
 * メッセージ送信リクエスト
 */
export type SendMessageRequest = {
    /**
     * メッセージ内容
     */
    content: string;
    messageType?: ChatMessageType;
    /**
     * 返信先メッセージID
     */
    replyToMessageId?: number | null;
};

