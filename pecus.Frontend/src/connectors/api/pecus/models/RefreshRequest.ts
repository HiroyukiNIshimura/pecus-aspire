/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceType } from './DeviceType';
import type { OSPlatform } from './OSPlatform';
/**
 * リフレッシュトークン交換 / ログアウト用リクエスト
 */
export type RefreshRequest = {
    /**
     * クライアントから送られるリフレッシュトークン
     */
    refreshToken: string;
    /**
     * デバイス名（任意）
     */
    deviceName?: string | null;
    deviceType?: DeviceType;
    os?: OSPlatform;
    /**
     * User-Agent（ヘッダー優先、任意）
     */
    userAgent?: string | null;
    /**
     * アプリバージョン（任意）
     */
    appVersion?: string | null;
    /**
     * タイムゾーン（任意）
     */
    timezone?: string | null;
    /**
     * ロケーション（任意）
     */
    location?: string | null;
    /**
     * IPアドレス（任意、未指定時はサーバー側推定）
     */
    ipAddress?: string | null;
};

