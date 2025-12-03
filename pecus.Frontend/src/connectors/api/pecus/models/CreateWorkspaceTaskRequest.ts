/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
import type { TaskType } from './TaskType';
/**
 * ワークスペースタスク作成リクエスト
 */
export type CreateWorkspaceTaskRequest = {
    /**
     * タスク内容
     */
    content: string;
    taskType: TaskType;
    /**
     * 担当ユーザーID
     */
    assignedUserId: number;
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
};

