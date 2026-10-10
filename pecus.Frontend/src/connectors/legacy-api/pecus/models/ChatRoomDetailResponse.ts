/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatNotificationSetting } from './ChatNotificationSetting';
import type { ChatRoomMemberItem } from './ChatRoomMemberItem';
import type { ChatRoomType } from './ChatRoomType';
/**
 * チャットルーム詳細レスポンス
 */
export type ChatRoomDetailResponse = {
    /**
     * ルームID
     */
    id: number;
    type: ChatRoomType;
    /**
     * ルーム名
     */
    name?: string | null;
    /**
     * ワークスペースID（ワークスペースグループチャットの場合）
     */
    workspaceId?: number | null;
    /**
     * ルームメンバー一覧
     */
    members: Array<ChatRoomMemberItem>;
    notificationSetting: ChatNotificationSetting;
    /**
     * 既読位置
     */
    lastReadAt?: string | null;
    /**
     * RowVersion（楽観的ロック用）
     */
    rowVersion: number;
    /**
     * ルーム作成日時
     */
    createdAt?: string;
    /**
     * ルーム更新日時
     */
    updatedAt?: string | null;
};

