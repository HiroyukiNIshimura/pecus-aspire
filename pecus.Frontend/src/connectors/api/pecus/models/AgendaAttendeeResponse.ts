/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttendanceStatus } from './AttendanceStatus';
import type { UserItem } from './UserItem';
export type AgendaAttendeeResponse = {
    userId: number;
    status: AttendanceStatus;
    isOptional: boolean;
    user?: UserItem;
};

