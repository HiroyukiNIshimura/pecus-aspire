/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceDetailUserResponse } from './WorkspaceDetailUserResponse';
/**
 * ワークスペース詳細情報（一般ユーザー用）
 */
export type WorkspaceFullDetailResponse = {
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
     * 作成ユーザー（無効なユーザーでも含む）
     */
    members?: Array<WorkspaceDetailUserResponse> | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
    createdBy?: WorkspaceDetailUserResponse;
    updatedBy?: WorkspaceDetailUserResponse;
};

