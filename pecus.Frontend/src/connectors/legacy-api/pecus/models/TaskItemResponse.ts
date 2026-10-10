/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
import type { UserIdentityResponse } from './UserIdentityResponse';
import type { WorkspaceMode } from './WorkspaceMode';
export type TaskItemResponse = {
    /**
     * ワークスペースID
     */
    workspaceId?: number;
    /**
     * ワークスペースコード
     */
    workspaceCode?: string | null;
    /**
     * ワークスペース名
     */
    workspaceName?: string | null;
    /**
     * ジャンルアイコン
     */
    genreIcon?: string | null;
    /**
     * ジャンル名
     */
    genreName?: string | null;
    mode?: WorkspaceMode;
    /**
     * コード
     */
    code?: string;
    /**
     * 件名
     */
    subject?: string;
    owner?: UserIdentityResponse;
    assignee?: UserIdentityResponse;
    committer?: UserIdentityResponse;
    priority?: TaskPriority;
    /**
     * 期限日時
     */
    dueDate?: string | null;
    /**
     * アーカイブフラグ
     */
    isArchived?: boolean;
    /**
     * 下書き中フラグ
     */
    isDraft?: boolean;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string;
};

