/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
import type { UserIdentityResponse } from './UserIdentityResponse';
/**
 * アイテム情報付きタスクレスポンス
 * タスク一覧でアイテムへのリンクを表示するために使用
 */
export type TaskWithItemResponse = {
    /**
     * リスト内での一意なインデックス（フロントエンドのReact key用）
     */
    listIndex?: number;
    /**
     * タスクID
     */
    taskId: number;
    /**
     * タスクシーケンス番号（アイテム内の順序）
     */
    sequence: number;
    /**
     * タスク内容
     */
    taskContent: string;
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
    priority?: TaskPriority | null;
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
    assigned?: UserIdentityResponse;
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
    itemCode: string;
    /**
     * アイテム件名
     */
    itemSubject: string;
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    itemOwner?: UserIdentityResponse;
    itemAssignee?: UserIdentityResponse | null;
    itemCommitter?: UserIdentityResponse | null;
    /**
     * コメントタイプ別件数
     */
    commentTypeCounts?: Record<string, number>;
};

