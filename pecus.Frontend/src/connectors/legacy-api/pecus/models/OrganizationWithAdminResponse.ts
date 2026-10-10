/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrganizationResponse } from './OrganizationResponse';
import type { UserDetailResponse } from './UserDetailResponse';
/**
 * 組織登録レスポンス（管理者ユーザー情報含む）
 */
export type OrganizationWithAdminResponse = {
    organization: OrganizationResponse;
    adminUser: UserDetailResponse;
};

