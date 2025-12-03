/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
import type { TaskType } from './TaskType';
/**
 * ワークスペースタスク更新リクエスト
 */
export type UpdateWorkspaceTaskRequest = {
    /**
     * タスク内容
     */
    content?: string | null;
    taskType?: TaskType;
    /**
     * 担当ユーザーID
     */
    assignedUserId?: number | null;
    priority?: TaskPriority;
    /**
     * 開始日時
     */
    startDate?: string | null;
    /**
     * 期限日時
     */
    dueDate?: string | null;
    /**
     * 予定工数（時間）
     */
    estimatedHours?: number | null;
    /**
     * 実績工数（時間）
     */
    actualHours?: number | null;
    /**
     * 進捗率（0-100）
     */
    progressPercentage?: number | null;
    /**
     * 完了フラグ
     */
    isCompleted?: boolean | null;
    /**
     * 破棄状態
     */
    isDiscarded?: boolean | null;
    /**
     * 破棄理由
     */
    discardReason?: string | null;
    /**
     * 楽観的ロック用のRowVersion（必須）
     */
    rowVersion: number;
};

