/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemNotificationType } from './SystemNotificationType';
/**
 * BackOffice用 システム通知作成リクエスト
 */
export type BackOfficeCreateNotificationRequest = {
    /**
     * 件名
     */
    subject: string;
    /**
     * 本文（Markdown形式）
     */
    body: string;
    type: SystemNotificationType;
    /**
     * 公開開始日時
     */
    publishAt: string;
    /**
     * 公開終了日時（null=無期限）
     */
    endAt?: string | null;
};

