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
    itemOwnerId?: number | null;
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
    itemAssigneeId?: number | null;
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
    itemCommitterId?: number | null;
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
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

