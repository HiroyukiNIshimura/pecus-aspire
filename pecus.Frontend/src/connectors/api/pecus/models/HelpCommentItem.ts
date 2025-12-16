/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ヘルプコメント項目
 */
export type HelpCommentItem = {
    /**
     * コメントID
     */
    commentId: number | string;
    /**
     * コメント内容
     */
    content: string;
    /**
     * コメント投稿日時
     */
    createdAt: string;
    /**
     * コメント投稿者ID
     */
    commentUserId: number | string;
    /**
     * コメント投稿者名
     */
    commentUsername: string;
    /**
     * コメント投稿者アバターURL
     */
    commentUserAvatarUrl?: string | null;
    /**
     * タスクID
     */
    taskId: number | string;
    /**
     * タスクシーケンス番号（アイテム内の順序）
     */
    taskSequence: number | string;
    /**
     * タスク内容
     */
    taskContent: string;
    /**
     * タスク担当者ID
     */
    taskAssigneeId?: number | string | null;
    /**
     * タスク担当者名
     */
    taskAssigneeName?: string | null;
    /**
     * ワークスペースID
     */
    workspaceId: number | string;
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    /**
     * ワークスペース名
     */
    workspaceName: string;
    /**
     * アイテムID
     */
    itemId: number | string;
    /**
     * アイテムコード（PROJ-42形式）
     */
    itemCode: string;
    /**
     * アイテム件名
     */
    itemSubject?: string | null;
};

