/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 組織メンバーアイテム（ページングレスポンスで使用）
 */
export type OrganizationMemberItem = {
    /**
     * ユーザーID
     */
    userId?: number;
    /**
     * ユーザー名
     */
    userName: string;
    /**
     * メールアドレス
     */
    email: string;
    /**
     * アイデンティティアイコンURL
     */
    identityIconUrl?: string | null;
};

