/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
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
    priority?: TaskPriority | null;
    /**
     * 期限日時(ISO 8601 形式)
     */
    dueDate?: string | null;
    /**
     * 下書き中フラグ
     */
    isDraft?: boolean | null;
    /**
     * 編集不可フラグ（アーカイブ）
     */
    isArchived?: boolean | null;
    /**
     * コミッターユーザーID（NULL可）
     */
    committerId?: number | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean | null;
    /**
     * タグ名のリスト（NULL: 変更なし、空配列: 全タグ削除、配列: 指定タグに置換）
     */
    tagNames?: Array<string> | null;
    /**
     * アイテムの楽観的ロック用のRowVersion
     */
    rowVersion: number;
    /**
     * 一時添付ファイルのセッションID（エディタでアップロードした画像を正式化するため）
     */
    tempSessionId?: string | null;
    /**
     * 一時添付ファイルIDのリスト（コンテンツ内で参照されている一時ファイル）
     */
    tempAttachmentIds?: Array<string> | null;
};

