/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceType } from './DeviceType';
import type { OSPlatform } from './OSPlatform';
/**
 * ログインリクエスト
 */
export type LoginRequest = {
    loginIdentifier: string;
    password: string;
    deviceName?: string | null;
    deviceType: DeviceType;
    os: OSPlatform;
    userAgent?: string | null;
    appVersion?: string | null;
    timezone?: string | null;
    location?: string | null;
    ipAddress?: string | null;
};

