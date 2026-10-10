/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タスクフローマップ用の先行タスク情報
 */
export type TaskFlowPredecessorInfo = {
    /**
     * タスクID
     */
    id: number;
    /**
     * タスクシーケンス番号
     */
    sequence: number;
    /**
     * タスク内容
     */
    content: string;
    /**
     * 完了フラグ
     */
    isCompleted: boolean;
};

