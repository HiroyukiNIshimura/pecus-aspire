/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskWithItemResponse } from './TaskWithItemResponse';
/**
 * 期限日でグループ化されたタスク一覧レスポンス
 */
export type TasksByDueDateResponse = {
    /**
     * 期限日（日付のみ）
     */
    dueDate: string;
    /**
     * その期限日のタスク一覧（アイテムID + タスクID順）
     */
    tasks: Array<TaskWithItemResponse> | null;
};

