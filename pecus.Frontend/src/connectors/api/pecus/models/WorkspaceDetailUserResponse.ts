/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceRole } from './WorkspaceRole';
/**
 * ワークスペース詳細取得用ユーザー情報
 */
export type WorkspaceDetailUserResponse = {
    /**
     * ユーザーID
     */
    id?: number;
    /**
     * ユーザー名
     */
    userName?: string | null;
    /**
     * メールアドレス
     */
    email?: string | null;
    /**
     * アイデンティティアイコン URL
     */
    identityIconUrl?: string | null;
    workspaceRole?: WorkspaceRole;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
    /**
     * 最終ログイン日時
     */
    lastLoginAt?: string | null;
};

