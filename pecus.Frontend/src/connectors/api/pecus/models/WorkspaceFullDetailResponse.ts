/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceGenreResponse } from './WorkspaceGenreResponse';
import type { WorkspaceUserInfoResponse } from './WorkspaceUserInfoResponse';
/**
 * ワークスペース詳細情報
 */
export type WorkspaceFullDetailResponse = {
    /**
     * ワークスペースID
     */
    id?: number;
    /**
     * ワークスペース名
     */
    name?: string | null;
    /**
     * ワークスペースコード
     */
    code?: string | null;
    /**
     * ワークスペースの説明
     */
    description?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    createdBy?: WorkspaceUserInfoResponse;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    updatedBy?: WorkspaceUserInfoResponse;
    genre?: WorkspaceGenreResponse;
    /**
     * このワークスペースに参加しているユーザー（有効ユーザーのみ）
     */
    members?: Array<WorkspaceUserInfoResponse> | null;
};

