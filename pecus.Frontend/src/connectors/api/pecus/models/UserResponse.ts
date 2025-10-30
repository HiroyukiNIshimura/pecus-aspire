/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ユーザー情報レスポンス
 */
export type UserResponse = {
    /**
     * ユーザーID
     */
    id?: number;
    /**
     * ログインID
     */
    loginId: string | null;
    /**
     * ユーザー名
     */
    username: string | null;
    /**
     * メールアドレス
     */
    email: string | null;
    /**
     * アバタータイプ
     */
    avatarType?: string | null;
    /**
     * アイデンティティアイコンURL
     */
    identityIconUrl?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
};

