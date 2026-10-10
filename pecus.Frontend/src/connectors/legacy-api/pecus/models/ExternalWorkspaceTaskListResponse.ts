/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalItemRefResponse } from './ExternalItemRefResponse';
import type { ExternalTaskSummaryResponse } from './ExternalTaskSummaryResponse';
import type { ExternalWorkspaceRefResponse } from './ExternalWorkspaceRefResponse';
/**
 * 外部公開用タスク一覧レスポンス
 */
export type ExternalWorkspaceTaskListResponse = {
    workspace: ExternalWorkspaceRefResponse;
    item: ExternalItemRefResponse;
    /**
     * タスク一覧
     */
    tasks: Array<ExternalTaskSummaryResponse>;
};

