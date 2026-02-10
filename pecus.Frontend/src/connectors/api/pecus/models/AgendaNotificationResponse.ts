/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaNotificationType } from './AgendaNotificationType';
import type { UserIdentityResponse } from './UserIdentityResponse';
/**
 * アジェンダ通知レスポンス
 */
export type AgendaNotificationResponse = {
    /**
     * 通知ID
     */
    id?: number;
    /**
     * アジェンダID
     */
    agendaId?: number;
    /**
     * アジェンダタイトル
     */
    agendaTitle: string;
    type?: AgendaNotificationType;
    /**
     * 対象回の開始日時（繰り返しイベントの特定回への通知の場合）
     */
    occurrenceStartAt?: string | null;
    /**
     * 通知メッセージ
     */
    message?: string | null;
    /**
     * 既読フラグ
     */
    isRead?: boolean;
    /**
     * 作成日時
     */
    createdAt?: string;
    createdBy?: UserIdentityResponse | null;
};

