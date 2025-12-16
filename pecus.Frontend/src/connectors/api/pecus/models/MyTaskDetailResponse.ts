/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
/**
 * ログインユーザーのタスク詳細レスポンス（アイテム情報含む）
 */
export type MyTaskDetailResponse = {
    /**
     * タスクID
     */
    id: number | string;
    /**
     * ワークスペースアイテムID
     */
    workspaceItemId?: number | string;
    /**
     * ワークスペースID
     */
    workspaceId?: number | string;
    /**
     * ワークスペースコード
     */
    workspaceCode?: string | null;
    /**
     * ワークスペース名
     */
    workspaceName?: string | null;
    /**
     * ジャンルアイコン
     */
    genreIcon?: string | null;
    /**
     * ジャンル名
     */
    genreName?: string | null;
    /**
     * アイテムコード
     */
    itemCode?: string | null;
    /**
     * アイテム件名
     */
    itemSubject?: string | null;
    /**
     * アイテムオーナーID
     */
    itemOwnerId?: number | string | null;
    /**
     * アイテムオーナー名
     */
    itemOwnerUsername?: string | null;
    /**
     * アイテムオーナーアバターURL
     */
    itemOwnerAvatarUrl?: string | null;
    /**
     * アイテム担当者ID
     */
    itemAssigneeId?: number | string | null;
    /**
     * アイテム担当者名
     */
    itemAssigneeUsername?: string | null;
    /**
     * アイテム担当者アバターURL
     */
    itemAssigneeAvatarUrl?: string | null;
    /**
     * アイテムコミッターID
     */
    itemCommitterId?: number | string | null;
    /**
     * アイテムコミッター名
     */
    itemCommitterUsername?: string | null;
    /**
     * アイテムコミッターアバターURL
     */
    itemCommitterAvatarUrl?: string | null;
    /**
     * 組織ID
     */
    organizationId?: number | string;
    /**
     * 担当ユーザーID
     */
    assignedUserId?: number | string;
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
    createdByUserId?: number | string;
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
    content?: string;
    /**
     * タスク種類ID
     */
    taskTypeId?: number | string;
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
    priority?: (null | TaskPriority);
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
    estimatedHours?: number | string | null;
    /**
     * 実績工数（時間）
     */
    actualHours?: number | string | null;
    /**
     * 進捗率（0-100）
     */
    progressPercentage?: number | string;
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
    commentCount?: number | string;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number | string;
};

