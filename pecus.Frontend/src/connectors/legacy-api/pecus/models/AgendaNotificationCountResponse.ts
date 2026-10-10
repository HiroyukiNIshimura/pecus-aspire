/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * アジェンダ通知件数レスポンス（ヘッダーバッジ用）
 */
export type AgendaNotificationCountResponse = {
    /**
     * 未回答の招待数
     */
    pendingInvitations?: number;
    /**
     * 未読通知数
     */
    unreadNotifications?: number;
    /**
     * 合計
     */
    total?: number;
};

