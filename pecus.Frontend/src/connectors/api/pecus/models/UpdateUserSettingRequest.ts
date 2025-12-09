/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 自ユーザー設定の更新リクエスト
 */
export type UpdateUserSettingRequest = {
    /**
     * メールを受信するかどうか
     */
    canReceiveEmail: boolean;
    /**
     * リアルタイム通知の可否
     */
    canReceiveRealtimeNotification: boolean;
    /**
     * タイムゾーン（TODO：未使用）
     * IANA zone name
     */
    timeZone: string;
    /**
     * 言語設定（TODO：未使用）
     */
    language: string;
    /**
     * ユーザー設定の楽観的ロック用 RowVersion
     */
    rowVersion: number;
};

