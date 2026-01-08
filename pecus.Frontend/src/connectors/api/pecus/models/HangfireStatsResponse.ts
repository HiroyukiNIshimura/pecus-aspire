/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Hangfireの統計情報レスポンス
 */
export type HangfireStatsResponse = {
    /**
     * 待機中ジョブ数
     */
    enqueued?: number;
    /**
     * 失敗ジョブ数
     */
    failed?: number;
    /**
     * 処理中ジョブ数
     */
    processing?: number;
    /**
     * スケジュール済みジョブ数
     */
    scheduled?: number;
    /**
     * 成功ジョブ数
     */
    succeeded?: number;
    /**
     * 削除済みジョブ数
     */
    deleted?: number;
    /**
     * 再試行ジョブ数
     */
    recurring?: number;
    /**
     * サーバー数
     */
    serverCount?: number;
    /**
     * ワーカー数
     */
    workerCount?: number;
};

