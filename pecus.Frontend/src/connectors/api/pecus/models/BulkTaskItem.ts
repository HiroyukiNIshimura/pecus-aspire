/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
/**
 * 一括作成用のタスク項目
 */
export type BulkTaskItem = {
    /**
     * タスク内容
     */
    content: string;
    /**
     * タスク種類ID
     */
    taskTypeId: number;
    /**
     * 担当ユーザーID
     */
    assignedUserId: number;
    priority?: TaskPriority | null;
    /**
     * 開始日
     */
    startDate?: string | null;
    /**
     * 期限日（必須）
     */
    dueDate: string;
    /**
     * 予定工数（時間）（人間が手動入力、AIの推定値は使用しない）
     */
    estimatedHours?: number | null;
    /**
     * 既存タスクを先行タスクとして指定する場合のタスクID配列
     * PredecessorIndicesとの併用不可（どちらか一方のみ指定）
     */
    predecessorTaskIds?: Array<number> | null;
    /**
     * 同一リクエスト内での先行タスクのインデックス配列（0始まり）
     * PredecessorTaskIdsとの併用不可（どちらか一方のみ指定）
     */
    predecessorIndices?: Array<number> | null;
};

