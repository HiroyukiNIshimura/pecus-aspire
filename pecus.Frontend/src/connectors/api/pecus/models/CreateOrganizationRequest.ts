/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 組織登録リクエスト
 */
export type CreateOrganizationRequest = {
    name: string;
    phoneNumber: string;
    code?: string | null;
    description?: string | null;
    representativeName?: string | null;
    email?: string | null;
    adminUsername: string;
    adminEmail: string;
};

