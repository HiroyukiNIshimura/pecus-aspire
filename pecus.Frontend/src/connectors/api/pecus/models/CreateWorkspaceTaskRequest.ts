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
    priority?: TaskPriority;
    /**
     * 開始日時(ISO 8601 形式)
     */
    startDate?: string | null;
    /**
     * 期限日時(ISO 8601 形式)
     */
    dueDate?: string | null;
    /**
     * 予定工数（時間）
     */
    estimatedHours?: number | null;
};

