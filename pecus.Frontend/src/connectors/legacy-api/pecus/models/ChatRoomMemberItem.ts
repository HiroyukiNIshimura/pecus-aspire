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
     * メールアドレス
     */
    email: string;
    role: ChatRoomRole;
    /**
     * 参加日時
     */
    joinedAt?: string;
    /**
     * 最終既読日時
     */
    lastReadAt?: string | null;
    /**
     * ユーザーID
     */
    id: number;
    /**
     * ユーザー名
     */
    username: string | null;
    /**
     * アイデンティティアイコンURL（表示用）
     * 必ず有効なURLが返されるため、クライアント側でnullチェック不要
     */
    identityIconUrl: string | null;
    /**
     * ユーザーがアクティブかどうか
     */
    isActive: boolean;
};

