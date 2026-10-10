/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 既読位置更新リクエスト
 */
export type UpdateReadPositionRequest = {
    /**
     * 既読日時
     */
    readAt: string;
    /**
     * 既読したメッセージID（省略可能）
     * SignalR で他のメンバーに通知する際に使用
     */
    readMessageId?: number | null;
};

