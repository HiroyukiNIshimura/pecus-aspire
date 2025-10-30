/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースアイテム更新リクエスト
 */
export type UpdateWorkspaceItemRequest = {
    /**
     * 件名
     */
    subject?: string | null;
    /**
     * 本文（WYSIWYGのノードデータをJSON形式で保存）
     */
    body?: string | null;
    /**
     * 作業中のユーザーID（NULL可）
     */
    assigneeId?: number | null;
    /**
     * 重要度（1: 低、2: 普通、3: 高）
     */
    priority?: number | null;
    /**
     * 期限日
     */
    dueDate?: string | null;
};

