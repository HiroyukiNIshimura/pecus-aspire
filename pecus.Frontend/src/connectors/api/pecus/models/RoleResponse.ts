/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemRole } from './SystemRole';
/**
 * ロール情報レスポンス
 */
export type RoleResponse = {
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
};

