/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageReplyItem } from './ChatMessageReplyItem';
import type { ChatMessageType } from './ChatMessageType';
import type { UserIdentityResponse } from './UserIdentityResponse';
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
    sender?: UserIdentityResponse | null;
    messageType: ChatMessageType;
    /**
     * メッセージ内容
     */
    content: string;
    /**
     * 返信先メッセージID
     */
    replyToMessageId?: number | null;
    replyTo?: ChatMessageReplyItem | null;
    /**
     * 作成日時
     */
    createdAt?: string;
};

