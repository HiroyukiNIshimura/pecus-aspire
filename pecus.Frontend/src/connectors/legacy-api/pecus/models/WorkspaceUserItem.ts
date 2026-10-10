/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceRole } from './WorkspaceRole';
/**
 * ワークスペースユーザー一覧用DTO（軽量）
 */
export type WorkspaceUserItem = {
    /**
     * メールアドレス
     */
    email: string;
    workspaceRole?: WorkspaceRole;
    /**
     * 最終ログイン日時
     */
    lastLoginAt?: string | null;
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

