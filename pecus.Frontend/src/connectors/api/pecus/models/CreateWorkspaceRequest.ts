/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceMode } from './WorkspaceMode';
/**
 * ワークスペース登録リクエスト
 */
export type CreateWorkspaceRequest = {
    name: string;
    description?: string | null;
    genreId: number;
    mode?: WorkspaceMode | null;
    /**
     * オーナーユーザーID（任意）
     */
    ownerId?: number | null;
};

