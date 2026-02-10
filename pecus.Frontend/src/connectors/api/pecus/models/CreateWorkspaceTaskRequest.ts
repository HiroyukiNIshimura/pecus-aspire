/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
/**
 * ワークスペースタスク作成リクエスト
 */
export type CreateWorkspaceTaskRequest = {
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
     * 先行タスクID配列（これらのタスクがすべて完了しないと着手できない）
     */
    predecessorTaskIds?: Array<number> | null;
};

