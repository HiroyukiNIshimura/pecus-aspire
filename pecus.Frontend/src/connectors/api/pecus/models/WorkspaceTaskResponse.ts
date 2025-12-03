/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceTaskDetailResponse } from './WorkspaceTaskDetailResponse';
/**
 * ワークスペースタスク操作レスポンス
 */
export type WorkspaceTaskResponse = {
    /**
     * 成功フラグ
     */
    success?: boolean;
    /**
     * メッセージ
     */
    message?: string | null;
    workspaceTask?: WorkspaceTaskDetailResponse;
};

