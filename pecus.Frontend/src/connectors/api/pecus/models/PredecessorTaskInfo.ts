/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 先行タスク情報
 */
export type PredecessorTaskInfo = {
    /**
     * タスクID
     */
    id?: number | string;
    /**
     * タスクシーケンス番号（アイテム内の順序）
     */
    sequence?: number | string;
    /**
     * タスク内容
     */
    content?: string;
    /**
     * 完了フラグ
     */
    isCompleted?: boolean;
    /**
     * ワークスペースアイテムコード（例: "PROJ-42"）
     */
    workspaceItemCode?: string | null;
};

