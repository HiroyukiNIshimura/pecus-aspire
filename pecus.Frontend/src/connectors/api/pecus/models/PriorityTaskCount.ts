/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
/**
 * 優先度ごとのタスク数
 */
export type PriorityTaskCount = {
    priority?: TaskPriority | null;
    /**
     * タスク数
     */
    count: number;
};

