/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityActionType } from './ActivityActionType';
/**
 * アクティビティレスポンス
 */
export type ActivityResponse = {
    /**
     * アクティビティID
     */
    id?: number | string;
    /**
     * ワークスペースID
     */
    workspaceId?: number | string;
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
    /**
     * アイテムID
     */
    itemId?: number | string;
    /**
     * アイテムコード
     */
    itemCode?: string;
    /**
     * アイテム件名
     */
    itemSubject?: string;
    /**
     * ユーザーID（NULL = システム操作）
     */
    userId?: number | string | null;
    /**
     * ユーザー名
     */
    username?: string | null;
    /**
     * ユーザーのアイデンティティアイコンURL
     */
    identityIconUrl?: string | null;
    /**
     * 操作タイプ
     */
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

