/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceUserInfoResponse } from './WorkspaceUserInfoResponse';
/**
 * ワークスペースアイテム一覧レスポンス（ページング対応）
 */
export type WorkspaceItemListResponse = {
    /**
     * アイテムID
     */
    id?: number;
    /**
     * アイテムコード
     */
    code?: string | null;
    /**
     * 件名
     */
    subject?: string | null;
    /**
     * 重要度（NULL の場合は Medium として扱う）
     */
    priority?: number | null;
    /**
     * 下書き中フラグ
     */
    isDraft?: boolean;
    /**
     * 編集不可フラグ（アーカイブ）
     */
    isArchived?: boolean;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作業中かどうか（作業中のユーザーID が存在するかで判定）
     */
    isAssigned?: boolean;
    owner?: WorkspaceUserInfoResponse;
};

