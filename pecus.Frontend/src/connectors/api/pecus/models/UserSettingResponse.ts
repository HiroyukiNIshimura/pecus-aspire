/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BadgeVisibility } from './BadgeVisibility';
import type { FocusScorePriority } from './FocusScorePriority';
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
    landingPage?: LandingPage | null;
    focusScorePriority?: FocusScorePriority | null;
    /**
     * やることピックアップタスクの表示件数（5-20）
     */
    focusTasksLimit: number;
    /**
     * 待機中タスクの表示件数（5-20）
     */
    waitingTasksLimit: number;
    badgeVisibility?: BadgeVisibility | null;
    pendingLandingPageRecommendation?: LandingPage | null;
    /**
     * ユーザーが最後にランディングページ設定を変更した日時
     */
    landingPageUpdatedAt?: string | null;
    /**
     * ユーザーがランディングページ推奨を拒否した日時（Cool-down制御用）
     */
    landingPageRecommendationRefusedAt?: string | null;
    /**
     * ユーザー設定の楽観的ロック用 RowVersion
     */
    rowVersion?: number;
};

