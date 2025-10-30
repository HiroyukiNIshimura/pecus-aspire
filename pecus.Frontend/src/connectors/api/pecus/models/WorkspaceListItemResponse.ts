/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceUserDetailResponse } from './WorkspaceUserDetailResponse';
/**
 * ワークスペースリストアイテムレスポンス
 */
export type WorkspaceListItemResponse = {
    /**
     * ワークスペースID
     */
    id?: number;
    /**
     * ワークスペース名
     */
    name: string | null;
    /**
     * ワークスペースコード
     */
    code?: string | null;
    /**
     * ワークスペースの説明
     */
    description?: string | null;
    /**
     * 組織ID
     */
    organizationId?: number;
    /**
     * 組織名
     */
    organizationName?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
    /**
     * 参加しているユーザー一覧
     */
    members?: Array<WorkspaceUserDetailResponse> | null;
};

