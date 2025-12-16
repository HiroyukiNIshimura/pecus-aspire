/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskFlowPredecessorInfo } from './TaskFlowPredecessorInfo';
import type { TaskPriority } from './TaskPriority';
/**
 * タスクフローマップのノード（個別タスク）
 */
export type TaskFlowNode = {
    /**
     * タスクID
     */
    id: number;
    /**
     * タスクシーケンス番号（アイテム内での通し番号）
     */
    sequence: number;
    /**
     * タスク内容
     */
    content: string;
    /**
     * タスク種類ID
     */
    taskTypeId?: number | null;
    /**
     * タスク種類名
     */
    taskTypeName?: string | null;
    /**
     * タスク種類アイコン
     */
    taskTypeIcon?: string | null;
    priority?: (null | TaskPriority);
    /**
     * 期限日時
     */
    dueDate?: string | null;
    /**
     * 進捗率（0-100）
     */
    progressPercentage: number;
    /**
     * 完了フラグ
     */
    isCompleted: boolean;
    /**
     * 破棄フラグ
     */
    isDiscarded: boolean;
    /**
     * 担当ユーザーID
     */
    assignedUserId?: number | null;
    /**
     * 担当ユーザー名
     */
    assignedUsername?: string | null;
    /**
     * 担当ユーザーアバターURL
     */
    assignedAvatarUrl?: string | null;
    /**
     * 着手可能か（先行タスクなし or 完了済み、かつ自身が未完了・未破棄）
     */
    canStart: boolean;
    /**
     * 先行タスクID
     */
    predecessorTaskId?: number | null;
    predecessorTask?: (null | TaskFlowPredecessorInfo);
    /**
     * 後続タスク数
     */
    successorCount: number;
};

