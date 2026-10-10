/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BulkTaskItem } from './BulkTaskItem';
/**
 * 一括タスク作成リクエスト
 */
export type BulkCreateTasksRequest = {
    /**
     * 作成するタスクのリスト
     */
    tasks: Array<BulkTaskItem>;
};

