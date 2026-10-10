/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ログインレスポンス用のデバイス情報（最小限）
 */
export type LoginDeviceInfo = {
    /**
     * デバイスID
     */
    id?: number | null;
    /**
     * デバイスの公開ID（セッション管理用）
     */
    publicId?: string | null;
    /**
     * 新規デバイスかどうか
     */
    isNewDevice?: boolean;
};

