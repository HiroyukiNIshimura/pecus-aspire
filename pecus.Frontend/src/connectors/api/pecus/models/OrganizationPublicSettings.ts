/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BadgeVisibility } from './BadgeVisibility';
import type { GenerativeApiVendor } from './GenerativeApiVendor';
import type { GroupChatScope } from './GroupChatScope';
import type { OrganizationPlan } from './OrganizationPlan';
import type { WorkspaceMode } from './WorkspaceMode';
/**
 * 組織の公開設定（センシティブ情報を除外）
 */
export type OrganizationPublicSettings = {
    aiProvider: GenerativeApiVendor;
    /**
     * AIプロバイダーが設定済みか（APIキーが登録されているか）
     */
    isAiConfigured: boolean;
    plan: OrganizationPlan;
    /**
     * タスク作成時に見積もりを必須とするか
     */
    requireEstimateOnTaskCreation: boolean;
    /**
     * 先行タスクが完了しないと次のタスクを操作できないようにするか
     */
    enforcePredecessorCompletion: boolean;
    groupChatScope?: GroupChatScope;
    defaultWorkspaceMode?: WorkspaceMode;
    /**
     * ゲーミフィケーション機能の有効/無効
     */
    gamificationEnabled: boolean;
    gamificationBadgeVisibility: BadgeVisibility;
    /**
     * ユーザーによるバッジ公開範囲のオーバーライドを許可するか
     */
    gamificationAllowUserOverride: boolean;
    /**
     * Botがグループチャットにメッセージを送信するか
     */
    botGroupChatMessagesEnabled: boolean;
};

