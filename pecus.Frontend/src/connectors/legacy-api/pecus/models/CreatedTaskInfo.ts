/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 作成されたタスク情報
 */
export type CreatedTaskInfo = {
    /**
     * リクエスト内でのインデックス（0始まり）
     */
    requestIndex?: number;
    /**
     * 作成されたタスクID
     */
    taskId?: number;
    /**
     * タスクシーケンス番号
     */
    sequence?: number;
    /**
     * タスク内容
     */
    content: string;
};

