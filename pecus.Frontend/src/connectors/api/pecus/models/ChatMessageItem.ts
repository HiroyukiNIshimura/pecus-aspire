/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageReplyItem } from './ChatMessageReplyItem';
import type { ChatMessageType } from './ChatMessageType';
import type { ChatUserItem } from './ChatUserItem';
/**
 * チャットメッセージ項目
 */
export type ChatMessageItem = {
    /**
     * メッセージID
     */
    id: number;
    /**
     * 送信者ユーザーID（AI/System メッセージの場合は null）
     */
    senderUserId?: number | null;
    sender?: ChatUserItem;
    messageType: ChatMessageType;
    /**
     * メッセージ内容
     */
    content: string;
    /**
     * 返信先メッセージID
     */
    replyToMessageId?: number | null;
    replyTo?: ChatMessageReplyItem;
    /**
     * 作成日時
     */
    createdAt?: string;
};

