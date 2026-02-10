/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskCommentType } from './TaskCommentType';
/**
 * タスクコメント作成リクエスト
 */
export type CreateTaskCommentRequest = {
    /**
     * コメント内容
     */
    content: string;
    commentType?: TaskCommentType | null;
};

