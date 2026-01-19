/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgendaAttendeeResponse } from './AgendaAttendeeResponse';
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
    createdByUserId: number;
    createdAt: string;
    updatedAt: string;
    rowVersion: number;
    createdByUser?: UserItem;
    attendees?: Array<AgendaAttendeeResponse>;
};

