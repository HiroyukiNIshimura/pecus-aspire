/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PredecessorTaskInfo } from './PredecessorTaskInfo';
import type { TaskPriority } from './TaskPriority';
import type { UserIdentityResponse } from './UserIdentityResponse';
/**
 * ワークスペースタスク詳細レスポンス
 */
export type WorkspaceTaskDetailResponse = {
    /**
     * リスト内でのインデックス（Reactのkey用）
     */
    listIndex?: number;
    /**
     * タスクID
     */
    id: number;
    /**
     * ワークスペースアイテムID
     */
    workspaceItemId?: number;
    /**
     * ワークスペースアイテム内でのシーケンス番号
     */
    sequence?: number;
    /**
     * ワークスペースID
     */
    workspaceId?: number;
    /**
     * 組織ID
     */
    organizationId?: number;
    itemOwner?: UserIdentityResponse;
    itemAssignee?: UserIdentityResponse;
    itemCommitter?: UserIdentityResponse;
    assigned?: UserIdentityResponse;
    createdBy?: UserIdentityResponse;
    completedBy?: UserIdentityResponse;
    /**
     * タスク内容
     */
    content?: string;
    /**
     * タスク種類ID
     */
    taskTypeId?: number;
    /**
     * タスク種類コード（例: "Bug", "Feature"）
     */
    taskTypeCode?: string | null;
    /**
     * タスク種類名（日本語表示名）
     */
    taskTypeName?: string | null;
    /**
     * タスク種類アイコン（拡張子なしのファイル名）
     */
    taskTypeIcon?: string | null;
    priority?: TaskPriority;
    /**
     * 開始日時
     */
    startDate?: string | null;
    /**
     * 期限日時（必須）
     */
    dueDate?: string;
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
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string;
    /**
     * コメント数
     */
    commentCount?: number;
    /**
     * コメントタイプ別件数（キーは TaskCommentType。NULL は Normal として集計）
     */
    commentTypeCounts?: Record<string, number>;
    /**
     * 先行タスクID配列（これらのタスクがすべて完了しないと着手できない）
     */
    predecessorTaskIds?: Array<number>;
    /**
     * 先行タスク情報リスト
     */
    predecessorTasks?: Array<PredecessorTaskInfo>;
    /**
     * このタスクを待っている後続タスク数
     */
    successorTaskCount?: number;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

