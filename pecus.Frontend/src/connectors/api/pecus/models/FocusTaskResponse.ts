/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PredecessorTaskInfo } from './PredecessorTaskInfo';
import type { SuccessorTaskInfo } from './SuccessorTaskInfo';
import type { TaskPriority } from './TaskPriority';
import type { TaskScoreDetail } from './TaskScoreDetail';
/**
 * フォーカス推奨タスクレスポンス
 */
export type FocusTaskResponse = {
    /**
     * タスクID
     */
    id: number;
    /**
     * タスクシーケンス番号（アイテム内の順序）
     */
    sequence: number;
    /**
     * ワークスペースアイテムID
     */
    workspaceItemId: number;
    /**
     * ワークスペースID
     */
    workspaceId: number;
    /**
     * ワークスペースコード
     */
    workspaceCode?: string | null;
    /**
     * ワークスペース名
     */
    workspaceName?: string | null;
    /**
     * アイテムコード（PROJ-42形式）
     */
    itemCode: string;
    /**
     * タスク内容
     */
    content: string;
    /**
     * アイテム件名
     */
    itemSubject?: string | null;
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
    priority?: (null | TaskPriority);
    /**
     * 期限日時
     */
    dueDate: string;
    /**
     * 予定工数（時間）
     */
    estimatedHours?: number | null;
    /**
     * 進捗率（0-100）
     */
    progressPercentage: number;
    /**
     * 総合スコア（高いほど優先度が高い）
     */
    totalScore: number;
    /**
     * 後続タスク数（このタスクを待っているタスクの数）
     */
    successorCount: number;
    successorTask?: (null | SuccessorTaskInfo);
    predecessorTask?: (null | PredecessorTaskInfo);
    scoreDetail?: (null | TaskScoreDetail);
};

