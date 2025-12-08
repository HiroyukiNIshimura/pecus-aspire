/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * デバイス情報レスポンス
 */
export type DeviceResponse = {
    /**
     * 紐づく端末ID（端末情報が無い場合は null）
     */
    id?: number | null;
    /**
     * 表示用短ID（端末がある場合）
     */
    publicId?: string | null;
    /**
     * 表示名
     */
    name?: string | null;
    /**
     * 端末の種類
     */
    deviceType?: string | null;
    /**
     * OS
     */
    os?: string | null;
    /**
     * クライアント情報
     */
    client?: string | null;
    /**
     * 初回確認日時
     */
    firstSeenAt?: string;
    /**
     * 最終確認日時
     */
    lastSeenAt?: string;
    /**
     * マスクされたIPアドレス
     */
    lastIpMasked?: string | null;
    /**
     * 最終確認場所
     */
    lastSeenLocation?: string | null;
    /**
     * タイムゾーン
     */
    timezone?: string | null;
    /**
     * 現在の端末判定用
     */
    isCurrentDevice?: boolean;
};

