/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * DM候補ユーザー項目（既存DMがないアクティブユーザー）
 */
export type DmCandidateUserItem = {
    /**
     * 最終アクティブ日時（最終ログイン日時）
     */
    lastActiveAt?: string | null;
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

