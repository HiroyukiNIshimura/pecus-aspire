/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceRole } from './WorkspaceRole';
/**
 * ワークスペースにユーザーを参加させるリクエスト
 */
export type AddUserToWorkspaceRequest = {
    userId: number;
    workspaceRole?: WorkspaceRole | null;
};

