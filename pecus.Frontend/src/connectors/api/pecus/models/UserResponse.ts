/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvatarType } from './AvatarType';
import type { UserRoleResponse } from './UserRoleResponse';
import type { UserSkillResponse } from './UserSkillResponse';
/**
 * ユーザー情報レスポンス
 */
export type UserResponse = {
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
    avatarType?: AvatarType;
    /**
     * アイデンティティアイコンURL
     */
    identityIconUrl?: string | null;
    /**
     * ユーザーのロール一覧
     */
    roles: Array<UserRoleResponse>;
    /**
     * ユーザーのスキル一覧
     */
    skills?: Array<UserSkillResponse> | null;
    /**
     * 管理者権限を持つかどうか
     */
    isAdmin: boolean;
    /**
     * アクティブなユーザーかどうか
     */
    isActive?: boolean;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * ユーザーの楽観的ロック用RowVersion
     */
    rowVersion: number;
};

