/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースにユーザーを参加させるリクエスト
 */
export type AddUserToWorkspaceRequest = {
    /**
     * 参加させるユーザーID
     */
    userId: number;
    /**
     * ワークスペース内での役割（例: Owner, Member, Guest）
     */
    workspaceRole?: string | null;
};

