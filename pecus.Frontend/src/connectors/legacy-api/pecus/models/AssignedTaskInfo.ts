/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 担当タスク情報（リンク生成用）
 */
export type AssignedTaskInfo = {
    /**
     * タスクID
     */
    taskId?: number;
    /**
     * タスクシーケンス番号（T-123 形式表示用）
     */
    taskSequence?: number;
    /**
     * タスク内容（省略表示用）
     */
    taskContent?: string;
    /**
     * 所属アイテムID
     */
    itemId?: number;
    /**
     * 所属アイテム番号
     */
    itemNumber?: number;
    /**
     * 所属アイテム件名（どのアイテムのタスクか分かるように）
     */
    itemSubject?: string;
    /**
     * ワークスペースコード（URL生成用）
     */
    workspaceCode?: string;
};

