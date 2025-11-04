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
    /**
     * ログイン識別子（EmailまたはLoginId）
     */
    loginIdentifier: string;
    /**
     * パスワード
     */
    password: string;
    /**
     * デバイス名（ユーザーが任意で付ける表示名）
     */
    deviceName?: string | null;
    deviceType: DeviceType;
    os: OSPlatform;
    /**
     * ユーザーエージェント情報
     */
    userAgent?: string | null;
    /**
     * アプリバージョン
     */
    appVersion?: string | null;
    /**
     * タイムゾーン
     */
    timezone?: string | null;
    /**
     * IPアドレス
     */
    ipAddress?: string | null;
};

