/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskItemResponse } from './TaskItemResponse';
import type { WorkspaceTaskDetailResponse } from './WorkspaceTaskDetailResponse';
/**
 * アイテムとそのタスクをグループ化したレスポンス
 */
export type ItemWithTasksResponse = {
    item: TaskItemResponse;
    /**
     * アイテムに紐づくタスクのリスト
     */
    tasks: Array<WorkspaceTaskDetailResponse> | null;
};

