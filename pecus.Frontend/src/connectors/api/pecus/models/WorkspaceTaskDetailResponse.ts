/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
import type { TaskType } from './TaskType';
/**
 * ワークスペースタスク詳細レスポンス
 */
export type WorkspaceTaskDetailResponse = {
    /**
     * タスクID
     */
    id: number;
    /**
     * ワークスペースアイテムID
     */
    workspaceItemId?: number;
    /**
     * ワークスペースID
     */
    workspaceId?: number;
    /**
     * 組織ID
     */
    organizationId?: number;
    /**
     * 担当ユーザーID
     */
    assignedUserId?: number;
    /**
     * 担当ユーザー名
     */
    assignedUsername?: string | null;
    /**
     * 担当ユーザーアバターURL
     */
    assignedAvatarUrl?: string | null;
    /**
     * 作成ユーザーID
     */
    createdByUserId?: number;
    /**
     * 作成ユーザー名
     */
    createdByUsername?: string | null;
    /**
     * 作成ユーザーアバターURL
     */
    createdByAvatarUrl?: string | null;
    /**
     * タスク内容
     */
    content?: string | null;
    taskType?: TaskType;
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
    progressPercentage?: number;
    /**
     * 完了フラグ
     */
    isCompleted?: boolean;
    /**
     * タスク完了日時
     */
    completedAt?: string | null;
    /**
     * 破棄状態
     */
    isDiscarded?: boolean;
    /**
     * 破棄日時
     */
    discardedAt?: string | null;
    /**
     * 破棄理由
     */
    discardReason?: string | null;
    /**
     * 表示順序
     */
    displayOrder?: number;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

