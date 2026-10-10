/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HotItemEntry } from './HotItemEntry';
/**
 * ホットアイテム統計レスポンス
 * 直近で作業が活発なアイテムのランキング
 */
export type DashboardHotItemsResponse = {
    /**
     * 集計期間（"24h" または "1week"）
     */
    period: string;
    /**
     * ホットアイテムリスト（アクティビティ数の多い順）
     */
    items: Array<HotItemEntry>;
};

