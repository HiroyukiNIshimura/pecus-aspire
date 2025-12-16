/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
    /**
     * アップロードしたユーザーID
     */
    uploadedByUserId?: number;
    /**
     * アップロードしたユーザー名
     */
    uploadedByUsername?: string | null;
};

