/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NewAchievementResponse } from './NewAchievementResponse';
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
    message?: string;
    workspaceTask?: WorkspaceTaskDetailResponse;
    previousWorkspaceTask?: WorkspaceTaskDetailResponse;
    /**
     * 新規取得バッジ（タスク完了時のみ）
     */
    newAchievements?: Array<NewAchievementResponse> | null;
};

