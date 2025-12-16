/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
/**
 * アイテム情報付きタスクレスポンス
 * タスク一覧でアイテムへのリンクを表示するために使用
 */
export type TaskWithItemResponse = {
    /**
     * リスト内での一意なインデックス（フロントエンドのReact key用）
     */
    listIndex?: number | string;
    /**
     * タスクID
     */
    taskId: number | string;
    /**
     * タスクシーケンス番号（アイテム内の順序）
     */
    sequence: number | string;
    /**
     * タスク内容
     */
    taskContent: string;
    /**
     * タスク種類ID
     */
    taskTypeId?: number | string | null;
    /**
     * タスク種類コード
     */
    taskTypeCode?: string | null;
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
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string;
    /**
     * アイテムID
     */
    itemId: number | string;
    /**
     * アイテムコード
     */
    itemCode: string;
    /**
     * アイテム件名
     */
    itemSubject: string;
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    /**
     * アイテムオーナーユーザーID
     */
    itemOwnerId?: number | string;
    /**
     * アイテムオーナーユーザー名
     */
    itemOwnerUsername?: string | null;
    /**
     * アイテムオーナーアバターURL
     */
    itemOwnerAvatarUrl?: string | null;
    /**
     * アイテムコミッターユーザーID
     */
    itemCommitterId?: number | string | null;
    /**
     * アイテムコミッターユーザー名
     */
    itemCommitterUsername?: string | null;
    /**
     * アイテムコミッターアバターURL
     */
    itemCommitterAvatarUrl?: string | null;
    /**
     * コメントタイプ別件数
     */
    commentTypeCounts?: Record<string, number | string>;
};

