/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * カテゴリ別未読数レスポンス
 */
export type ChatUnreadCountByCategoryResponse = {
    /**
     * 全体の未読メッセージ数
     */
    totalUnreadCount: number;
    /**
     * DM の未読数
     */
    dmUnreadCount: number;
    /**
     * グループチャットの未読数
     */
    groupUnreadCount: number;
    /**
     * AI チャットの未読数
     */
    aiUnreadCount: number;
    /**
     * システム通知の未読数
     */
    systemUnreadCount: number;
};

