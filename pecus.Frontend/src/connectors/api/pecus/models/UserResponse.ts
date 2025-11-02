/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserRoleResponse } from './UserRoleResponse';
import type { UserSkillResponse } from './UserSkillResponse';
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
     * ユーザーのロール一覧
     */
    roles?: Array<UserRoleResponse> | null;
    /**
     * ユーザーのスキル一覧
     */
    skills?: Array<UserSkillResponse> | null;
    /**
     * 管理者権限を持つかどうか
     */
    isAdmin?: boolean;
    /**
     * アクティブなユーザーかどうか
     */
    isActive?: boolean;
    /**
     * 作成日時
     */
    createdAt?: string;
};

