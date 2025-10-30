/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrganizationInfoResponse } from './OrganizationInfoResponse';
/**
 * ワークスペース詳細情報レスポンス
 */
export type WorkspaceDetailResponse = {
    /**
     * ワークスペースID
     */
    id?: number;
    /**
     * ワークスペース名
     */
    name: string | null;
    /**
     * ワークスペースコード
     */
    code?: string | null;
    /**
     * ワークスペースの説明
     */
    description?: string | null;
    /**
     * 組織ID
     */
    organizationId?: number;
    organization?: OrganizationInfoResponse;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作成者ユーザーID
     */
    createdByUserId?: number | null;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * 更新者ユーザーID
     */
    updatedByUserId?: number | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
};

