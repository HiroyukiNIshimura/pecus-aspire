/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PriorityTaskCount } from './PriorityTaskCount';
/**
 * 優先度別タスク数レスポンス
 */
export type DashboardTasksByPriorityResponse = {
    /**
     * 優先度別の内訳
     */
    priorities: Array<PriorityTaskCount>;
    /**
     * 合計（進行中タスクのみ）
     */
    totalCount: number;
};

