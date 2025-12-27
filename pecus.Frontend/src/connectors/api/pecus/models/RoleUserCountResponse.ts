/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemRole } from './SystemRole';
/**
 * ロールごとのユーザー数
 */
export type RoleUserCountResponse = {
    /**
     * ロールID
     */
    id: number;
    name: SystemRole;
    /**
     * ユーザー数
     */
    count: number;
};

