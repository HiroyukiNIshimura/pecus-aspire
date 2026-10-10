/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalItemRefResponse } from './ExternalItemRefResponse';
import type { ExternalTaskDetailResponse } from './ExternalTaskDetailResponse';
import type { ExternalWorkspaceRefResponse } from './ExternalWorkspaceRefResponse';
/**
 * 外部公開用タスク詳細レスポンス
 */
export type ExternalWorkspaceTaskDetailResponse = {
    workspace: ExternalWorkspaceRefResponse;
    item: ExternalItemRefResponse;
    task: ExternalTaskDetailResponse;
};

