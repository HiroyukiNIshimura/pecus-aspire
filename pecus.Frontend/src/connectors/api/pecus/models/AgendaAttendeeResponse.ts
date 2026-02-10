/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttendanceStatus } from './AttendanceStatus';
import type { UserIdentityResponse } from './UserIdentityResponse';
export type AgendaAttendeeResponse = {
    userId: number;
    status: AttendanceStatus;
    occurrenceStatus?: AttendanceStatus | null;
    isOptional: boolean;
    /**
     * 個人リマインダー設定（分単位のリスト、null=デフォルト設定を使用）
     */
    customReminders?: Array<number> | null;
    user?: UserIdentityResponse | null;
};

