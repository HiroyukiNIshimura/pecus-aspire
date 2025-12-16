/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardItemSummary } from './DashboardItemSummary';
import type { DashboardTaskSummary } from './DashboardTaskSummary';
/**
 * ダッシュボード統計サマリレスポンス
 * タスクとアイテムの現在状態を集計したサマリ情報
 */
export type DashboardSummaryResponse = {
    /**
     * タスク統計
     */
    taskSummary: DashboardTaskSummary;
    /**
     * アイテム統計
     */
    itemSummary: DashboardItemSummary;
};

