/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelatedItemInfo } from './RelatedItemInfo';
import type { TagInfoResponse } from './TagInfoResponse';
import type { TaskPriority } from './TaskPriority';
import type { UserIdentityResponse } from './UserIdentityResponse';
import type { WorkspaceMode } from './WorkspaceMode';
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
     * ジャンル名
     */
    genreName?: string | null;
    workspaceMode?: WorkspaceMode;
    /**
     * コード
     */
    code?: string;
    /**
     * 件名
     */
    subject?: string;
    /**
     * 本文
     */
    body?: string | null;
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
    /**
     * タグのリスト
     */
    tags?: Array<TagInfoResponse>;
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
    relatedItems?: Array<RelatedItemInfo>;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

