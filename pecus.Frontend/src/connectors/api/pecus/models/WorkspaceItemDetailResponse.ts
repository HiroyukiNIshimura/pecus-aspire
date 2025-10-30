/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TagInfoResponse } from './TagInfoResponse';
/**
 * ワークスペースアイテム詳細レスポンス
 */
export type WorkspaceItemDetailResponse = {
    /**
     * アイテムID
     */
    id?: number;
    /**
     * ワークスペースID
     */
    workspaceId?: number;
    /**
     * ワークスペース名
     */
    workspaceName?: string | null;
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
    /**
     * 重要度（1: 低、2: 普通、3: 高）
     */
    priority?: number;
    /**
     * 期限日
     */
    dueDate?: string;
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
};

