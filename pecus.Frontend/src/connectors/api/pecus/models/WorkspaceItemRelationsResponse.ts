/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemRelationResponse } from './WorkspaceItemRelationResponse';
/**
 * ワークスペースアイテム関連一覧レスポンス
 */
export type WorkspaceItemRelationsResponse = {
    /**
     * 関連元としての関連一覧（このアイテムから他へ）
     */
    relationsFrom?: Array<WorkspaceItemRelationResponse> | null;
    /**
     * 関連先としての関連一覧（他からこのアイテムへ）
     */
    relationsTo?: Array<WorkspaceItemRelationResponse> | null;
    /**
     * 全関連数
     */
    totalCount?: number;
};

