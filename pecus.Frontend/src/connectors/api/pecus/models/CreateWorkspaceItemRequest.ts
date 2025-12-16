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
     * 作業中のユーザーID（NULL可）
     */
    assigneeId?: number | string | null;
    priority?: (null | TaskPriority);
    /**
     * 期限日時(ISO 8601 形式)
     */
    dueDate?: string | null;
    /**
     * 下書き中フラグ
     */
    isDraft?: boolean;
    /**
     * コミッターユーザーID（NULL可）
     */
    committerId?: number | string | null;
    /**
     * タグ名のリスト（存在しないタグは自動作成）
     */
    tagNames?: any[] | null;
    /**
     * 一時添付ファイルのセッションID（エディタでアップロードした画像を正式化するため）
     */
    tempSessionId?: string | null;
    /**
     * 一時添付ファイルIDのリスト（コンテンツ内で参照されている一時ファイル）
     */
    tempAttachmentIds?: any[] | null;
};

