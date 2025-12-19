/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * DM候補ユーザー項目（既存DMがないアクティブユーザー）
 */
export type DmCandidateUserItem = {
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
     * 最終アクティブ日時（最終ログイン日時）
     */
    lastActiveAt?: string | null;
};

