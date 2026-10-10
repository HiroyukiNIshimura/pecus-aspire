/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserIdentityResponse = {
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

