/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
import type { UserIdentityResponse } from './UserIdentityResponse';
import type { WorkspaceMode } from './WorkspaceMode';
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
    workspaceMode?: WorkspaceMode;
    /**
     * アイテムコード
     */
    itemCode?: string | null;
    /**
     * アイテム件名
     */
    itemSubject?: string | null;
    itemOwner?: UserIdentityResponse;
    itemAssignee?: UserIdentityResponse;
    itemCommitter?: UserIdentityResponse;
    createdBy?: UserIdentityResponse;
    /**
     * 組織ID
     */
    organizationId?: number;
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
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

