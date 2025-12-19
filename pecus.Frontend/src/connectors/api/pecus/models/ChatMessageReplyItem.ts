/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageType } from './ChatMessageType';
/**
 * 返信先メッセージ項目（簡易版）
 */
export type ChatMessageReplyItem = {
    /**
     * メッセージID
     */
    id: number;
    /**
     * 送信者ユーザーID
     */
    senderUserId?: number | null;
    /**
     * 送信者ユーザー名
     */
    senderUsername?: string | null;
    messageType: ChatMessageType;
    /**
     * メッセージ内容（プレビュー用、切り詰め）
     */
    contentPreview: string;
};

