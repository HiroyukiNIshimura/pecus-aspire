/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalUserRefResponse } from './ExternalUserRefResponse';
import type { TaskCommentType } from './TaskCommentType';
/**
 * 外部公開用タスクコメント
 */
export type ExternalTaskCommentResponse = {
    /**
     * コメントID
     */
    id: number;
    user: ExternalUserRefResponse;
    /**
     * コメント内容
     */
    content: string;
    commentType?: TaskCommentType | null;
};

