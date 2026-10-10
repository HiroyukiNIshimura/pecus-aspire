/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemNotificationType } from './SystemNotificationType';
/**
 * BackOffice用 システム通知リスト項目レスポンス
 */
export type BackOfficeNotificationListItemResponse = {
    /**
     * 通知ID
     */
    id: number;
    /**
     * 件名
     */
    subject: string;
    type?: SystemNotificationType;
    /**
     * 公開開始日時
     */
    publishAt?: string;
    /**
     * 公開終了日時
     */
    endAt?: string | null;
    /**
     * 配信済みフラグ
     */
    isProcessed?: boolean;
    /**
     * 配信日時
     */
    processedAt?: string | null;
    /**
     * 削除済みフラグ
     */
    isDeleted?: boolean;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作成者ユーザー名
     */
    createdByUserName?: string | null;
    /**
     * 楽観的ロック用バージョン番号
     */
    rowVersion: number;
};

