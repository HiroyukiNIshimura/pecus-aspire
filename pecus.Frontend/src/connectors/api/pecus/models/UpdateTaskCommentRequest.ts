/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskCommentType } from './TaskCommentType';
/**
 * タスクコメント更新リクエスト
 */
export type UpdateTaskCommentRequest = {
    /**
     * コメント内容
     */
    content?: string | null;
    commentType?: TaskCommentType;
    /**
     * 楽観的ロック用のRowVersion（必須）
     */
    rowVersion: number;
};

