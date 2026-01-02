/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceResponse } from './DeviceResponse';
/**
 * デバイス一覧レスポンス（現在のデバイスPublicId付き）
 */
export type DeviceListResponse = {
    /**
     * デバイス一覧
     */
    devices?: Array<DeviceResponse>;
    /**
     * 現在のリクエストに対応するデバイスのPublicId
     * リクエスト情報からマッチングして特定
     */
    currentDevicePublicId?: string | null;
};

