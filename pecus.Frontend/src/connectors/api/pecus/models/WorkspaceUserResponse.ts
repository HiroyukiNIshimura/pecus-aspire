/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceUserDetailResponse } from './WorkspaceUserDetailResponse';
/**
 * ワークスペースユーザー登録レスポンス
 */
export type WorkspaceUserResponse = {
    /**
     * 成功フラグ
     */
    success?: boolean;
    /**
     * メッセージ
     */
    message?: string | null;
    workspaceUser?: WorkspaceUserDetailResponse;
};

