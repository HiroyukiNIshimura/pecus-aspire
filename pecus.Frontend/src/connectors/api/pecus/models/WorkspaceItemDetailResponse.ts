/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelatedItemInfo } from './RelatedItemInfo';
import type { TagInfoResponse } from './TagInfoResponse';
import type { TaskPriority } from './TaskPriority';
/**
 * ワークスペースアイテム詳細レスポンス
 */
export type WorkspaceItemDetailResponse = {
    /**
     * アイテムID
     */
    id: number;
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
     * コード
     */
    code?: string | null;
    /**
     * 件名
     */
    subject?: string | null;
    /**
     * 本文
     */
    body?: string | null;
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
     * 期限日
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
    /**
     * タグのリスト
     */
    tags?: Array<TagInfoResponse> | null;
    /**
     * ログイン中のユーザーがこのアイテムをPINしているか
     */
    isPinned?: boolean;
    /**
     * このアイテムのPIN総数
     */
    pinCount?: number;
    /**
     * 関連アイテムのリスト
     */
    relatedItems?: Array<RelatedItemInfo> | null;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

