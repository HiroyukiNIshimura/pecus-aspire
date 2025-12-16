/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from './TaskPriority';
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
    /**
     * コード
     */
    code?: string;
    /**
     * 件名
     */
    subject?: string;
    /**
     * オーナーユーザーID
     */
    ownerId?: number;
    /**
     * オーナーユーザー名
     */
    ownerUsername?: string | null;
    /**
     * オーナーアバターURL
     */
    ownerAvatarUrl?: string | null;
    /**
     * 作業中のユーザーID
     */
    assigneeId?: number | null;
    /**
     * 作業中のユーザー名
     */
    assigneeUsername?: string | null;
    /**
     * 作業中のユーザーアバターURL
     */
    assigneeAvatarUrl?: string | null;
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
     * コミッターユーザーID
     */
    committerId?: number | null;
    /**
     * コミッターユーザー名
     */
    committerUsername?: string | null;
    /**
     * コミッターアバターURL
     */
    committerAvatarUrl?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string;
};

