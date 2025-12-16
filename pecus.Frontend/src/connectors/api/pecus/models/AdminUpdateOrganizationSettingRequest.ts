/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenerativeApiVendor } from './GenerativeApiVendor';
import type { HelpNotificationTarget } from './HelpNotificationTarget';
import type { OrganizationPlan } from './OrganizationPlan';
/**
 * 組織設定更新リクエスト（管理者用）
 */
export type AdminUpdateOrganizationSettingRequest = {
    /**
     * タスク超過チェックの閾値（日数）。0で未設定。
     */
    taskOverdueThreshold?: number | string;
    /**
     * 週間レポートの配信曜日（0=未設定 / 1=日曜〜7=土曜を想定）
     */
    weeklyReportDeliveryDay?: number | string;
    /**
     * メール配信元アドレス
     */
    mailFromAddress?: string | null;
    /**
     * メール配信元名
     */
    mailFromName?: string | null;
    /**
     * 利用する生成APIベンダー
     * GenerativeApiVendor.Noneの場合、生成APIは利用しない。
     */
    generativeApiVendor: GenerativeApiVendor;
    /**
     * 生成APIキー
     */
    generativeApiKey?: string | null;
    /**
     * 利用プラン
     */
    plan: OrganizationPlan;
    helpNotificationTarget?: (null | HelpNotificationTarget);
    /**
     * タスク作成時に見積もりを必須とするか
     */
    requireEstimateOnTaskCreation?: boolean;
    /**
     * 先行タスクが完了しないと次のタスクを操作できないようにするか
     */
    enforcePredecessorCompletion?: boolean;
    /**
     * ダッシュボードに表示するヘルプコメントの最大件数（5〜20）
     */
    dashboardHelpCommentMaxCount?: number | string;
    /**
     * 楽観的ロック用RowVersion
     */
    rowVersion: number | string;
};

