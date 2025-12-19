/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * チャットユーザー項目（簡易版）
 */
export type ChatUserItem = {
    /**
     * ユーザーID
     */
    id: number;
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
    /**
     * アクティブフラグ（false の場合は退会済み/無効化されたユーザー）
     */
    isActive?: boolean;
};

