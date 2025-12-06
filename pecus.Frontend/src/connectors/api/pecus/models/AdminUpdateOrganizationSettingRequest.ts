/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenerativeApiVendor } from './GenerativeApiVendor';
import type { OrganizationPlan } from './OrganizationPlan';
/**
 * 組織設定更新リクエスト（管理者用）
 */
export type AdminUpdateOrganizationSettingRequest = {
    /**
     * タスク超過チェックの閾値（日数）。0で未設定。
     */
    taskOverdueThreshold?: number;
    /**
     * 週間レポートの配信曜日（0=未設定 / 1=日曜〜7=土曜を想定）
     */
    weeklyReportDeliveryDay?: number;
    /**
     * メール配信元アドレス
     */
    mailFromAddress?: string | null;
    /**
     * メール配信元名
     */
    mailFromName?: string | null;
    generativeApiVendor: GenerativeApiVendor;
    plan: OrganizationPlan;
    /**
     * 楽観的ロック用RowVersion
     */
    rowVersion: number;
};

