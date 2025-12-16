/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskCommentDetailResponse } from './TaskCommentDetailResponse';
/**
 * タスクコメント操作レスポンス
 */
export type TaskCommentResponse = {
    /**
     * 成功フラグ
     */
    success?: boolean;
    /**
     * メッセージ
     */
    message?: string;
    taskComment?: (null | TaskCommentDetailResponse);
};

