/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースユーザー詳細レスポンス
 */
export type WorkspaceUserDetailResponse = {
    /**
     * ワークスペースID
     */
    workspaceId?: number;
    /**
     * ユーザーID
     */
    userId?: number;
    /**
     * ユーザー名
     */
    username?: string | null;
    /**
     * メールアドレス
     */
    email?: string | null;
    /**
     * ワークスペース内での役割
     */
    workspaceRole?: string | null;
    /**
     * 参加日時
     */
    joinedAt?: string;
    /**
     * 最終アクセス日時
     */
    lastAccessedAt?: string | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
};

