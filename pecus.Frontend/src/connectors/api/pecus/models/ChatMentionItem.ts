/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatActorType } from './ChatActorType';
/**
 * チャットメッセージのメンション項目
 */
export type ChatMentionItem = {
    /**
     * メンションID
     */
    id: number;
    /**
     * メンション対象アクターID
     */
    mentionedActorId: number;
    /**
     * メンション対象ユーザーID（ボットの場合は null）
     */
    mentionedUserId?: number | null;
    /**
     * メンション対象ボットID（ユーザーの場合は null）
     */
    mentionedBotId?: number | null;
    /**
     * メンション表示名
     */
    displayName: string;
    actorType: ChatActorType;
};

