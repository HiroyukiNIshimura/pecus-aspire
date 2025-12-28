/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * BackOffice用 組織削除リクエスト
 */
export type BackOfficeDeleteOrganizationRequest = {
    /**
     * 確認用組織名（誤操作防止）
     */
    confirmOrganizationName: string;
    /**
     * 楽観的ロック用バージョン番号
     */
    rowVersion: number;
};

