/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * デバイス情報レスポンス
 */
export type DeviceResponse = {
    /**
     * リフレッシュトークンID（セッションID）
     */
    refreshTokenId: number;
    /**
     * 紐づく端末ID（端末情報が無い場合は null）
     */
    deviceId?: number | null;
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
     * アプリバージョン
     */
    appVersion?: string | null;
    /**
     * トークン作成日時
     */
    tokenCreatedAt?: string;
    /**
     * トークン有効期限
     */
    tokenExpiresAt?: string;
    /**
     * トークンが無効化されているか
     */
    tokenIsRevoked?: boolean;
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
     * 端末が無効化されているか
     */
    deviceIsRevoked?: boolean;
};

