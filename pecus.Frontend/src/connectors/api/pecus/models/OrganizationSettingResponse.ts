/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BadgeVisibility } from './BadgeVisibility';
import type { GenerativeApiVendor } from './GenerativeApiVendor';
import type { GroupChatScope } from './GroupChatScope';
import type { HelpNotificationTarget } from './HelpNotificationTarget';
import type { OrganizationPlan } from './OrganizationPlan';
import type { WorkspaceMode } from './WorkspaceMode';
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
    /**
     * 利用する生成AIモデル（例: gpt-4o, gemini-1.5-pro）
     */
    generativeApiModel?: string | null;
    plan: OrganizationPlan;
    helpNotificationTarget?: HelpNotificationTarget;
    /**
     * タスク作成時に見積もりを必須とするか
     */
    requireEstimateOnTaskCreation: boolean;
    /**
     * 先行タスクが完了しないと次のタスクを操作できないようにするか
     */
    enforcePredecessorCompletion: boolean;
    /**
     * ダッシュボードに表示するヘルプコメントの最大件数（5〜20）
     */
    dashboardHelpCommentMaxCount: number;
    groupChatScope?: GroupChatScope;
    defaultWorkspaceMode?: WorkspaceMode;
    /**
     * Gamification機能の有効/無効
     */
    gamificationEnabled: boolean;
    gamificationBadgeVisibility: BadgeVisibility;
    /**
     * ユーザーがバッジ公開範囲を変更可能か
     */
    gamificationAllowUserOverride: boolean;
    /**
     * 楽観的ロック用RowVersion
     */
    rowVersion: number;
};

