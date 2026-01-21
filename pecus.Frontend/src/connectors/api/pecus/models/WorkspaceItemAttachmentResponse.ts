/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserIdentityResponse } from './UserIdentityResponse';
import type { WorkspaceItemAttachmentTask } from './WorkspaceItemAttachmentTask';
/**
 * ワークスペースアイテム添付ファイルレスポンス
 */
export type WorkspaceItemAttachmentResponse = {
    /**
     * 添付ファイルID
     */
    id: number;
    /**
     * ワークスペースアイテムID
     */
    workspaceItemId?: number;
    /**
     * ワークスペースタスクID（オプション）
     */
    workspaceTaskId?: number | null;
    /**
     * ファイル名
     */
    fileName?: string;
    /**
     * ファイルサイズ（バイト）
     */
    fileSize?: number;
    /**
     * MIMEタイプ
     */
    mimeType?: string;
    /**
     * ダウンロードURL
     */
    downloadUrl?: string;
    /**
     * サムネイル（サイズM）URL
     */
    thumbnailMediumUrl?: string | null;
    /**
     * サムネイル（サイズS）URL
     */
    thumbnailSmallUrl?: string | null;
    /**
     * アップロード日時
     */
    uploadedAt?: string;
    uploadedBy?: UserIdentityResponse;
    task?: WorkspaceItemAttachmentTask;
};

