/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FocusScorePriority } from './FocusScorePriority';
import type { LandingPage } from './LandingPage';
/**
 * ユーザーの公開設定
 */
export type UserPublicSettings = {
    /**
     * タイムゾーン（IANA zone name）
     */
    timeZone: string;
    /**
     * 言語設定
     */
    language: string;
    /**
     * メール受信の可否
     */
    canReceiveEmail: boolean;
    /**
     * リアルタイム通知の可否
     */
    canReceiveRealtimeNotification: boolean;
    landingPage?: LandingPage;
    focusScorePriority?: FocusScorePriority;
    /**
     * フォーカス推奨タスクの表示件数
     */
    focusTasksLimit: number;
    /**
     * 待機中タスクの表示件数
     */
    waitingTasksLimit: number;
};

