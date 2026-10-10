/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * アジェンダ中止リクエスト
 */
export type CancelAgendaRequest = {
    /**
     * 中止理由
     */
    reason?: string | null;
    rowVersion: number;
    /**
     * 参加者へ中止通知を送信するか
     */
    sendNotification?: boolean;
};

