/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskFlowPredecessorInfo } from './TaskFlowPredecessorInfo';
import type { TaskPriority } from './TaskPriority';
import type { UserIdentityResponse } from './UserIdentityResponse';
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
    priority?: TaskPriority;
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
    assigned?: UserIdentityResponse;
    completedBy?: UserIdentityResponse;
    /**
     * 着手可能か（先行タスクなし or 完了済み、かつ自身が未完了・未破棄）
     */
    canStart: boolean;
    /**
     * 先行タスクID配列
     */
    predecessorTaskIds?: Array<number>;
    predecessorTask?: TaskFlowPredecessorInfo;
    /**
     * 後続タスク数
     */
    successorCount: number;
    /**
     * 所要期間（日数）
     * StartDate（なければ前タスクのDueDate、最初のタスクならCreatedAt）からDueDateまでの期間
     * 完了・破棄済みの場合はnull
     */
    durationDays?: number | null;
    /**
     * 先行タスクとの期限日コンフリクトがあるか
     * 先行タスクの期限日が自タスクの期限日より後の場合にtrue
     */
    hasDueDateConflict?: boolean;
};

