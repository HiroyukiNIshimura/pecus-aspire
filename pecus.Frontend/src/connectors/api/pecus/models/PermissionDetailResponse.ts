/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleInfoResponse } from './RoleInfoResponse';
/**
 * 権限詳細レスポンス（ロールを含む）
 */
export type PermissionDetailResponse = {
    /**
     * 権限ID
     */
    id?: number;
    /**
     * 権限名
     */
    name: string | null;
    /**
     * 権限の説明
     */
    description?: string | null;
    /**
     * 権限カテゴリ
     */
    category?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * この権限を持つロール一覧
     */
    roles?: Array<RoleInfoResponse> | null;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: string | null;
};

