/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttendanceStatus } from './AttendanceStatus';
import type { RecurrenceType } from './RecurrenceType';
import type { UserIdentityResponse } from './UserIdentityResponse';
/**
 * アジェンダ展開済みオカレンス（一覧用）
 * 繰り返しイベントを展開した各回を表すDTO
 */
export type AgendaOccurrenceResponse = {
    /**
     * 親アジェンダID
     */
    agendaId: number;
    /**
     * 例外ID（この回が変更されている場合）
     */
    exceptionId?: number | null;
    /**
     * オカレンスのインデックス（0から始まる、何回目かを特定）
     */
    occurrenceIndex: number;
    /**
     * この回の開始日時
     */
    startAt: string;
    /**
     * この回の終了日時
     */
    endAt: string;
    /**
     * タイトル（例外で変更されていればその値）
     */
    title: string;
    /**
     * 場所
     */
    location?: string | null;
    /**
     * URL
     */
    url?: string | null;
    /**
     * 終日イベントか
     */
    isAllDay?: boolean;
    recurrenceType?: RecurrenceType;
    /**
     * この回は中止されているか
     */
    isCancelled?: boolean;
    /**
     * 中止理由
     */
    cancellationReason?: string | null;
    /**
     * この回のみ変更されているか
     */
    isModified?: boolean;
    /**
     * 参加者数
     */
    attendeeCount?: number;
    myAttendanceStatus?: AttendanceStatus;
    createdBy?: UserIdentityResponse;
};

