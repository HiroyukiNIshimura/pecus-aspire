/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemRelationResponse } from './WorkspaceItemRelationResponse';
/**
 * ワークスペースアイテム関連追加レスポンス
 */
export type AddWorkspaceItemRelationResponse = {
    /**
     * 成功フラグ
     */
    success?: boolean;
    /**
     * メッセージ
     */
    message?: string;
    relation?: (null | WorkspaceItemRelationResponse);
};

