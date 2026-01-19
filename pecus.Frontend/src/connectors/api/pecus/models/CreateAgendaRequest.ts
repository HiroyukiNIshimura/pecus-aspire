/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaAttendeeRequest } from './AgendaAttendeeRequest';
export type CreateAgendaRequest = {
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    isAllDay?: boolean;
    location?: string | null;
    url?: string | null;
    /**
     * 参加者リスト
     */
    attendees?: Array<AgendaAttendeeRequest>;
};

