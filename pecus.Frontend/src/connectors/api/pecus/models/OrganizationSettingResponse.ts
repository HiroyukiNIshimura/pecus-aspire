/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenerativeApiVendor } from './GenerativeApiVendor';
import type { HelpNotificationTarget } from './HelpNotificationTarget';
import type { OrganizationPlan } from './OrganizationPlan';
/**
 * 組織設定レスポンス
 */
export type OrganizationSettingResponse = {
    /**
     * タスク超過チェックの閾値（日数）
     */
    taskOverdueThreshold: number;
    /**
     * 週間レポートの配信曜日（0=未設定/日曜起点などクライアント定義）
     */
    weeklyReportDeliveryDay: number;
    /**
     * メール配信元のメールアドレス
     */
    mailFromAddress?: string | null;
    /**
     * メール配信元のFrom（表示名）
     */
    mailFromName?: string | null;
    generativeApiVendor: GenerativeApiVendor;
    /**
     * 生成APIキー
     */
    generativeApiKey?: string | null;
    plan: OrganizationPlan;
    helpNotificationTarget?: HelpNotificationTarget;
    /**
     * 楽観的ロック用RowVersion
     */
    rowVersion: number;
};

