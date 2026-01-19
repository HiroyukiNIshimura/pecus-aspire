/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaAttendeeRequest } from './AgendaAttendeeRequest';
import type { RecurrenceType } from './RecurrenceType';
export type CreateAgendaRequest = {
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    isAllDay?: boolean;
    location?: string | null;
    url?: string | null;
    recurrenceType?: RecurrenceType;
    /**
     * 繰り返し間隔（例: 2週間ごと = Weekly + Interval=2）
     */
    recurrenceInterval?: number;
    /**
     * 月次（曜日指定）の場合の週番号（1-5, 5=最終週）
     */
    recurrenceWeekOfMonth?: number | null;
    /**
     * 繰り返し終了日（null=無期限、RecurrenceCountと排他）
     */
    recurrenceEndDate?: string | null;
    /**
     * 繰り返し終了回数（null=無期限、RecurrenceEndDateと排他）
     */
    recurrenceCount?: number | null;
    /**
     * リマインダー設定（分単位のリスト: 1440=1日前, 60=1時間前など）
     */
    reminders?: Array<number> | null;
    /**
     * 参加者リスト
     */
    attendees?: Array<AgendaAttendeeRequest>;
    /**
     * 作成時に参加者へ通知を送信するか
     */
    sendNotification?: boolean;
};

