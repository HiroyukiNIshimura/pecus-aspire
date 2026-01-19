/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaAttendeeRequest } from './AgendaAttendeeRequest';
import type { RecurrenceType } from './RecurrenceType';
/**
 * 「この回以降」更新リクエスト（シリーズ分割）
 */
export type UpdateFromOccurrenceRequest = {
    /**
     * 分割起点となる回の開始日時
     */
    fromStartAt: string;
    /**
     * タイトル
     */
    title: string;
    /**
     * 詳細（Markdown対応）
     */
    description?: string | null;
    /**
     * 新しいシリーズの開始日時
     */
    startAt: string;
    /**
     * 新しいシリーズの終了日時
     */
    endAt: string;
    /**
     * 終日フラグ
     */
    isAllDay?: boolean;
    /**
     * 場所
     */
    location?: string | null;
    /**
     * URL
     */
    url?: string | null;
    recurrenceType?: RecurrenceType;
    /**
     * 繰り返し間隔
     */
    recurrenceInterval?: number;
    /**
     * 月次曜日指定時の週番号（1-5）
     */
    recurrenceWeekOfMonth?: number | null;
    /**
     * 繰り返し終了日
     */
    recurrenceEndDate?: string | null;
    /**
     * 繰り返し回数
     */
    recurrenceCount?: number | null;
    /**
     * リマインダー（分単位のリスト）
     */
    reminders?: Array<number> | null;
    /**
     * 参加者リスト（指定しない場合は元のシリーズから引き継ぎ）
     */
    attendees?: Array<AgendaAttendeeRequest> | null;
    /**
     * 変更通知を送信するか
     */
    sendNotification?: boolean;
};

