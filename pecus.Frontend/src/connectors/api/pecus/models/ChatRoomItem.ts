/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageItem } from './ChatMessageItem';
import type { ChatNotificationSetting } from './ChatNotificationSetting';
import type { ChatRoomType } from './ChatRoomType';
import type { UserIdentityResponse } from './UserIdentityResponse';
/**
 * チャットルーム一覧項目
 */
export type ChatRoomItem = {
    /**
     * ルームID
     */
    id: number;
    type: ChatRoomType;
    /**
     * ルーム名（DM の場合は相手のユーザー名）
     */
    name?: string | null;
    /**
     * ワークスペースID（ワークスペースグループチャットの場合）
     */
    workspaceId?: number | null;
    otherUser?: UserIdentityResponse;
    latestMessage?: ChatMessageItem;
    /**
     * 未読メッセージ数
     */
    unreadCount?: number;
    notificationSetting: ChatNotificationSetting;
    /**
     * ルーム作成日時
     */
    createdAt?: string;
    /**
     * ルーム更新日時（最終アクティビティ）
     */
    updatedAt?: string | null;
};

