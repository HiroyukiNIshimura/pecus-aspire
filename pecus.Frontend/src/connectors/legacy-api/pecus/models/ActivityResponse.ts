/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityActionType } from './ActivityActionType';
import type { UserIdentityResponse } from './UserIdentityResponse';
import type { WorkspaceMode } from './WorkspaceMode';
/**
 * アクティビティレスポンス
 */
export type ActivityResponse = {
    /**
     * アクティビティID
     */
    id?: number;
    /**
     * ワークスペースID
     */
    workspaceId?: number;
    /**
     * ワークスペースコード
     */
    workspaceCode?: string;
    /**
     * ワークスペース名
     */
    workspaceName?: string;
    /**
     * ワークスペースのジャンルアイコン
     */
    workspaceGenreIcon?: string | null;
    workspaceMode?: WorkspaceMode;
    /**
     * アイテムID
     */
    itemId?: number;
    /**
     * アイテムコード
     */
    itemCode?: string;
    /**
     * アイテム件名
     */
    itemSubject?: string;
    user?: UserIdentityResponse;
    actionType?: ActivityActionType;
    /**
     * 操作の詳細データ（JSON文字列）
     */
    details?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
};

