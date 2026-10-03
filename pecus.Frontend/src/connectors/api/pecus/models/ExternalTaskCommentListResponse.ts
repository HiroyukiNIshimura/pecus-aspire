/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalItemRefResponse } from './ExternalItemRefResponse';
import type { ExternalTaskCommentResponse } from './ExternalTaskCommentResponse';
import type { ExternalTaskRefResponse } from './ExternalTaskRefResponse';
import type { ExternalWorkspaceRefResponse } from './ExternalWorkspaceRefResponse';
/**
 * 外部公開用タスクコメント一覧レスポンス
 */
export type ExternalTaskCommentListResponse = {
    workspace: ExternalWorkspaceRefResponse;
    item: ExternalItemRefResponse;
    task: ExternalTaskRefResponse;
    /**
     * コメント一覧
     */
    comments: Array<ExternalTaskCommentResponse>;
};

