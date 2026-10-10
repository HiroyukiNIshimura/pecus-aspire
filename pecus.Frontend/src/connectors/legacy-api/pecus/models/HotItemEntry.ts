/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceMode } from './WorkspaceMode';
/**
 * ホットアイテムのエントリ
 */
export type HotItemEntry = {
    /**
     * アイテムID
     */
    itemId: number;
    /**
     * アイテムコード（URL用）
     */
    itemCode: string;
    /**
     * アイテム件名
     */
    itemSubject: string;
    /**
     * ワークスペースID
     */
    workspaceId: number;
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    /**
     * ワークスペース名
     */
    workspaceName: string;
    /**
     * ジャンルアイコン
     */
    genreIcon?: string | null;
    mode?: WorkspaceMode;
    /**
     * 直近のアクティビティ数
     */
    activityCount: number;
    /**
     * 最終アクティビティ日時（UTC）
     */
    lastActivityAt: string;
    /**
     * 最終操作者のユーザーID（システム操作の場合はnull）
     */
    lastActorId?: number | null;
    /**
     * 最終操作者の表示名
     */
    lastActorName?: string | null;
    /**
     * 最終操作者のアバターURL
     */
    lastActorAvatar?: string | null;
    /**
     * 最終操作の種類（例: "編集", "コメント", "ファイル追加"）
     */
    lastActionLabel?: string | null;
    /**
     * 現在のユーザーがこのアイテムにアクセス可能か
     */
    canAccess: boolean;
};

