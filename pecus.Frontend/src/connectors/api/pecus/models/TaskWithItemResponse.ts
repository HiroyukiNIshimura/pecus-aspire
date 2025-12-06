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
     * タスクID
     */
    taskId: number;
    /**
     * タスク内容
     */
    taskContent: string | null;
    /**
     * タスク種類ID
     */
    taskTypeId?: number | null;
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
    itemId: number;
    /**
     * アイテムコード
     */
    itemCode: string | null;
    /**
     * アイテム件名
     */
    itemSubject: string | null;
    /**
     * ワークスペースコード
     */
    workspaceCode: string | null;
    /**
     * アイテムオーナーユーザーID
     */
    itemOwnerId?: number;
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
    itemCommitterId?: number | null;
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
    commentTypeCounts?: {
        Normal?: number;
        Memo?: number;
        HelpWanted?: number;
        NeedReply?: number;
        Reminder?: number;
        Urge?: number;
    } | null;
};

