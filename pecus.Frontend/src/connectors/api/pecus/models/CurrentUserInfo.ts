/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 現在ログイン中のユーザーの最小限情報
 */
export type CurrentUserInfo = {
    /**
     * ユーザーID
     */
    id: number;
    /**
     * 組織ID
     */
    organizationId: number;
    /**
     * ユーザー名
     */
    username: string;
    /**
     * メールアドレス
     */
    email: string;
    /**
     * アイデンティティアイコンURL（表示用）
     */
    identityIconUrl?: string | null;
    /**
     * 管理者権限を持つかどうか
     */
    isAdmin: boolean;
    /**
     * バックオフィス権限を持つかどうか
     */
    isBackOffice: boolean;
};

