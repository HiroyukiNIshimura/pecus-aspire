/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PermissionDetailInfoResponse } from './PermissionDetailInfoResponse';
/**
 * ロール詳細レスポンス（権限を含む）
 */
export type RoleDetailResponse = {
    /**
     * ロールID
     */
    id?: number;
    /**
     * ロール名
     */
    name: string | null;
    /**
     * ロールの説明
     */
    description?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * ロールが持つ権限一覧
     */
    permissions?: Array<PermissionDetailInfoResponse> | null;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: string | null;
};

