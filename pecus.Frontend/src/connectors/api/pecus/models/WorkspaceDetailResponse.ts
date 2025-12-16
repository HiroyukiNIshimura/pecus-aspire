/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrganizationInfoResponse } from './OrganizationInfoResponse';
import type { WorkspaceDetailUserResponse } from './WorkspaceDetailUserResponse';
/**
 * ワークスペース詳細情報レスポンス（管理者用）
 */
export type WorkspaceDetailResponse = {
    /**
     * ワークスペースID
     */
    id: number;
    /**
     * ワークスペース名
     */
    name: string;
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
    organization?: (null | OrganizationInfoResponse);
    /**
     * ジャンルID
     */
    genreId?: number | null;
    /**
     * ジャンル名
     */
    genreName?: string | null;
    /**
     * ジャンルアイコン
     */
    genreIcon?: string | null;
    /**
     * 参加しているユーザー一覧
     */
    members?: any[] | null;
    owner?: (null | WorkspaceDetailUserResponse);
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
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

