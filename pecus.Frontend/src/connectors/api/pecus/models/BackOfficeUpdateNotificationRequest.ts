/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemNotificationType } from './SystemNotificationType';
/**
 * BackOffice用 システム通知更新リクエスト
 */
export type BackOfficeUpdateNotificationRequest = {
    /**
     * 件名
     */
    subject?: string | null;
    /**
     * 本文（Markdown形式）
     */
    body?: string | null;
    type?: SystemNotificationType | null;
    /**
     * 公開開始日時
     */
    publishAt?: string | null;
    /**
     * 公開終了日時（null=無期限）
     */
    endAt?: string | null;
    /**
     * 楽観的ロック用バージョン番号
     */
    rowVersion: number;
};

