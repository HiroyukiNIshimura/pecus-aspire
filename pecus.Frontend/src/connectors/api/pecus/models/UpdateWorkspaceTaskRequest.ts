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
    taskTypeId?: number | string | null;
    /**
     * 担当ユーザーID
     */
    assignedUserId?: number | string | null;
    priority?: (null | TaskPriority);
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
    estimatedHours?: number | string | null;
    /**
     * 実績工数（時間）
     */
    actualHours?: number | string | null;
    /**
     * 進捗率（0-100）
     */
    progressPercentage?: number | string | null;
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
    predecessorTaskId?: number | string | null;
    /**
     * 先行タスクを解除するかどうか（trueの場合、PredecessorTaskIdをnullに設定）
     */
    clearPredecessorTask?: boolean;
    /**
     * 楽観的ロック用のRowVersion（必須）
     */
    rowVersion: number | string;
};

