/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceRole } from './WorkspaceRole';
/**
 * ワークスペースユーザー詳細レスポンス
 */
export type WorkspaceUserDetailResponse = {
    /**
     * ワークスペースID
     */
    workspaceId: number;
    /**
     * メールアドレス
     */
    email: string;
    workspaceRole?: WorkspaceRole | null;
    /**
     * 参加日時
     */
    joinedAt?: string;
    /**
     * 最終アクセス日時
     */
    lastAccessedAt?: string | null;
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

