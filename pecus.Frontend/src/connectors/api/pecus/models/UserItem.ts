/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ユーザー一覧項目
 */
export type UserItem = {
    /**
     * ユーザーID
     */
    id: number;
    /**
     * ログインID
     */
    loginId: string;
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
     * アクティブフラグ
     */
    isActive?: boolean;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 最終ログイン日時
     */
    lastLoginAt?: string | null;
    /**
     * ユーザーが持つロール数
     */
    roleCount?: number;
};

