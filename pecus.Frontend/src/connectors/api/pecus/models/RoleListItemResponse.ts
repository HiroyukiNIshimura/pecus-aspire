/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemRole } from './SystemRole';
/**
 * ロールリスト項目レスポンス
 */
export type RoleListItemResponse = {
    /**
     * ロールID
     */
    id: number;
    name: SystemRole;
    /**
     * ロールの説明
     */
    description?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * ロールが持つ権限数
     */
    permissionCount?: number;
};

