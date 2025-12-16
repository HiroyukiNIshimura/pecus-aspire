/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelationType } from './RelationType';
/**
 * ワークスペースアイテム関連情報レスポンス
 */
export type WorkspaceItemRelationResponse = {
    /**
     * 関連ID
     */
    id: number | string;
    /**
     * 関連元アイテムID
     */
    fromItemId?: number | string;
    /**
     * 関連元アイテムコード
     */
    fromItemCode?: string;
    /**
     * 関連元アイテム件名
     */
    fromItemSubject?: string;
    /**
     * 関連先アイテムID
     */
    toItemId?: number | string;
    /**
     * 関連先アイテムコード
     */
    toItemCode?: string;
    /**
     * 関連先アイテム件名
     */
    toItemSubject?: string;
    relationType?: (null | RelationType);
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作成者ID
     */
    createdByUserId?: number | string;
    /**
     * 作成者ユーザー名
     */
    createdByUsername?: string;
};

