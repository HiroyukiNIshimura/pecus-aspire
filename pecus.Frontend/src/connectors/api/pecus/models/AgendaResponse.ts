/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaAttendeeResponse } from './AgendaAttendeeResponse';
import type { RecurrenceType } from './RecurrenceType';
import type { UserItem } from './UserItem';
export type AgendaResponse = {
    id: number;
    organizationId: number;
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    isAllDay: boolean;
    location?: string | null;
    url?: string | null;
    recurrenceType?: RecurrenceType;
    /**
     * 繰り返し間隔
     */
    recurrenceInterval?: number;
    /**
     * 月次（曜日指定）の場合の週番号
     */
    recurrenceWeekOfMonth?: number | null;
    /**
     * 繰り返し終了日
     */
    recurrenceEndDate?: string | null;
    /**
     * 繰り返し終了回数
     */
    recurrenceCount?: number | null;
    /**
     * デフォルトリマインダー（分単位のリスト）
     */
    reminders?: Array<number> | null;
    /**
     * 中止フラグ
     */
    isCancelled?: boolean;
    /**
     * 中止理由
     */
    cancellationReason?: string | null;
    /**
     * 中止日時
     */
    cancelledAt?: string | null;
    cancelledByUser?: UserItem;
    createdByUserId: number;
    createdAt: string;
    updatedAt: string;
    rowVersion: number;
    createdByUser?: UserItem;
    attendees?: Array<AgendaAttendeeResponse>;
};

