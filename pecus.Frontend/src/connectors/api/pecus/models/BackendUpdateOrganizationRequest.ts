/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 組織更新リクエスト（バックエンドサービス用）
 */
export type BackendUpdateOrganizationRequest = {
    name?: string | null;
    code?: string | null;
    description?: string | null;
    representativeName?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    isActive?: boolean | null;
    rowVersion: number;
};

