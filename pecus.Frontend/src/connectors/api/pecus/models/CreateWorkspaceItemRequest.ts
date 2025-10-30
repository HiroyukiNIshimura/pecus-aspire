/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースアイテム作成リクエスト
 */
export type CreateWorkspaceItemRequest = {
    /**
     * 件名
     */
    subject: string;
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
    priority?: number;
    /**
     * 期限日
     */
    dueDate: string;
    /**
     * 下書き中フラグ
     */
    isDraft?: boolean;
    /**
     * タグ名のリスト（存在しないタグは自動作成）
     */
    tagNames?: Array<string> | null;
};

