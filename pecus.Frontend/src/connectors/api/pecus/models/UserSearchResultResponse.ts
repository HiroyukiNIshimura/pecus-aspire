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
    id?: number | string;
    /**
     * ユーザー名
     */
    username: string;
    /**
     * メールアドレス
     */
    email: string;
    avatarType?: (null | AvatarType);
    /**
     * アイデンティティアイコンURL
     */
    identityIconUrl?: string | null;
    /**
     * ユーザーが持つスキル一覧
     */
    skills?: Array<UserSearchSkillResponse>;
};

