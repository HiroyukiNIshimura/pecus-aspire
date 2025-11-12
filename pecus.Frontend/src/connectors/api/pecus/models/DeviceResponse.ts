/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * デバイス情報レスポンス
 */
export type DeviceResponse = {
    /**
     * 端末ID
     */
    id: number;
    /**
     * 表示用短ID
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
     * アプリバージョン
     */
    appVersion?: string | null;
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
     * 有効なリフレッシュトークン数
     */
    refreshTokenCount?: number;
    /**
     * 無効化フラグ
     */
    isRevoked?: boolean;
};

