/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
/**
 * ワークスペースタスク更新リクエスト
 */
export type UpdateWorkspaceTaskRequest = {
    /**
     * タスク内容
     */
    content?: string | null;
    /**
     * タスク種類ID
     */
    taskTypeId?: number | null;
    /**
     * 担当ユーザーID
     */
    assignedUserId?: number | null;
    priority?: TaskPriority;
    /**
     * 開始日時(ISO 8601 形式)
     */
    startDate?: string | null;
    /**
     * 期限日時(ISO 8601 形式)（必須）
     */
    dueDate: string;
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
     * 先行タスクID（このタスクが完了しないと着手できない）
     * nullを設定すると先行タスクを解除
     */
    predecessorTaskId?: number | null;
    /**
     * 先行タスクを解除するかどうか（trueの場合、PredecessorTaskIdをnullに設定）
     */
    clearPredecessorTask?: boolean;
    /**
     * 楽観的ロック用のRowVersion（必須）
     */
    rowVersion: number;
};

