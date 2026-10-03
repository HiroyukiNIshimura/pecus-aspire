/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalPredecessorTaskResponse } from './ExternalPredecessorTaskResponse';
import type { ExternalTaskDiscardedResponse } from './ExternalTaskDiscardedResponse';
import type { ExternalTaskTypeRefResponse } from './ExternalTaskTypeRefResponse';
import type { ExternalUserRefResponse } from './ExternalUserRefResponse';
import type { TaskPriority } from './TaskPriority';
/**
 * 外部公開用タスク詳細
 */
export type ExternalTaskDetailResponse = {
    /**
     * シーケンス番号（アイテム内一意）
     */
    sequence: number;
    assignedUser: ExternalUserRefResponse;
    createdByUser: ExternalUserRefResponse;
    /**
     * タスク内容
     */
    content: string;
    taskType: ExternalTaskTypeRefResponse;
    priority?: TaskPriority | null;
    /**
     * 開始日時
     */
    startDate?: string | null;
    /**
     * 期限日時
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
    progressPercentage: number;
    /**
     * 完了フラグ
     */
    isCompleted: boolean;
    /**
     * 完了日時
     */
    completedAt?: string | null;
    completedByUser?: ExternalUserRefResponse | null;
    discarded?: ExternalTaskDiscardedResponse | null;
    /**
     * 先行タスク一覧
     */
    predecessorTasks: Array<ExternalPredecessorTaskResponse>;
};

