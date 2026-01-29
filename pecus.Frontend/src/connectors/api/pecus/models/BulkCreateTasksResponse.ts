/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatedTaskInfo } from './CreatedTaskInfo';
/**
 * 一括タスク作成の応答
 */
export type BulkCreateTasksResponse = {
    /**
     * 作成されたタスクの一覧
     */
    createdTasks: Array<CreatedTaskInfo>;
    /**
     * 作成されたタスク数
     */
    totalCreated?: number;
};

