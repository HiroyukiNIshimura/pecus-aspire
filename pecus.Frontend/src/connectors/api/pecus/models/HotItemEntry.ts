/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
    /**
     * 直近のアクティビティ数
     */
    activityCount: number;
    /**
     * 最終アクティビティ日時（UTC）
     */
    lastActivityAt: string;
};

