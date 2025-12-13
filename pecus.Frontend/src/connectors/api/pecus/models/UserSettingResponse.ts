/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LandingPage } from './LandingPage';
/**
 * ユーザー設定レスポンス
 */
export type UserSettingResponse = {
    /**
     * メール受信の可否
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
    landingPage?: LandingPage;
    /**
     * ユーザー設定の楽観的ロック用 RowVersion
     */
    rowVersion?: number;
};

