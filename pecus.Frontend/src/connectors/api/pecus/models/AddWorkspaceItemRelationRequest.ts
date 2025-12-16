/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelationType } from './RelationType';
/**
 * ワークスペースアイテム関連追加リクエスト
 */
export type AddWorkspaceItemRelationRequest = {
    /**
     * 関連先アイテムID
     */
    toItemId: number | string;
    relationType?: (null | RelationType);
};

