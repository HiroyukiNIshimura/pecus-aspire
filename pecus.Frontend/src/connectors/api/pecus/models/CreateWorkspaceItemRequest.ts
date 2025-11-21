/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
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
     * HTML形式の本文
     */
    htmlBody?: string | null;
    /**
     * プレーンテキスト形式の本文
     */
    rawBody?: string | null;
    /**
     * 作業中のユーザーID（NULL可）
     */
    assigneeId?: number | null;
    priority?: TaskPriority;
    /**
     * 期限日（NULL許容）
     */
    dueDate?: string | null;
    /**
     * 下書き中フラグ
     */
    isDraft?: boolean;
    /**
     * コミッターユーザーID（NULL可）
     */
    committerId?: number | null;
    /**
     * タグ名のリスト（存在しないタグは自動作成）
     */
    tagNames?: Array<string> | null;
};

