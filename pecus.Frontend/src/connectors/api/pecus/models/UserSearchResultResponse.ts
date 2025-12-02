/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvatarType } from './AvatarType';
import type { UserSearchSkillResponse } from './UserSearchSkillResponse';
/**
 * ユーザー検索結果レスポンス
 */
export type UserSearchResultResponse = {
    /**
     * ユーザーID
     */
    id?: number;
    /**
     * ユーザー名
     */
    username: string | null;
    /**
     * メールアドレス
     */
    email: string | null;
    avatarType?: AvatarType;
    /**
     * アイデンティティアイコンURL
     */
    identityIconUrl?: string | null;
    /**
     * ユーザーが持つスキル一覧
     */
    skills?: Array<UserSearchSkillResponse> | null;
};

