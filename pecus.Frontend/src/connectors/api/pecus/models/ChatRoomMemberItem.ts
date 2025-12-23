/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatRoomRole } from './ChatRoomRole';
/**
 * チャットルームメンバー項目
 */
export type ChatRoomMemberItem = {
    /**
     * ユーザーID
     */
    userId: number;
    /**
     * ユーザー名
     */
    username: string;
    /**
     * メールアドレス
     */
    email: string;
    /**
     * アバタータイプ
     */
    avatarType?: string | null;
    /**
     * アイデンティティアイコンURL
     */
    identityIconUrl?: string | null;
    role: ChatRoomRole;
    /**
     * 参加日時
     */
    joinedAt?: string;
    /**
     * 最終既読日時
     */
    lastReadAt?: string | null;
};

