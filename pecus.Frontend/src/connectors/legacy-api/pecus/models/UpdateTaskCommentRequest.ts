/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タスクコメント更新リクエスト
 * コメントタイプは変更不可（内容のみ編集可能）
 */
export type UpdateTaskCommentRequest = {
    /**
     * コメント内容
     */
    content?: string | null;
    /**
     * 楽観的ロック用のRowVersion（必須）
     */
    rowVersion: number;
};

