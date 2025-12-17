/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelationType } from './RelationType';
/**
 * ワークスペースアイテム関連レスポンス
 */
export type WorkspaceItemRelationResponse = {
    /**
     * 関連ID
     */
    id?: number;
    /**
     * 関連元アイテムID
     */
    fromItemId?: number;
    /**
     * 関連先アイテムID
     */
    toItemId?: number;
    relationType?: RelationType;
};

