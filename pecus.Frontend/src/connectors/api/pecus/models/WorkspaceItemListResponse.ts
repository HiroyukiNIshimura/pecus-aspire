/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceDetailUserResponse } from './WorkspaceDetailUserResponse';
/**
 * ワークスペースアイテム一覧レスポンス（ページング対応）
 */
export type WorkspaceItemListResponse = {
    id?: number;
    code?: string | null;
    subject?: string | null;
    priority?: number | null;
    isDraft?: boolean;
    isArchived?: boolean;
    createdAt?: string;
    isAssigned?: boolean;
    owner?: WorkspaceDetailUserResponse;
};

