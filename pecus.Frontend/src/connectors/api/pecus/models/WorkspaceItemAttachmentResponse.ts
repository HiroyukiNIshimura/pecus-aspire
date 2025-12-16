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
    id: number | string;
    /**
     * ワークスペースアイテムID
     */
    workspaceItemId?: number | string;
    /**
     * ファイル名
     */
    fileName?: string;
    /**
     * ファイルサイズ（バイト）
     */
    fileSize?: number | string;
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
    uploadedByUserId?: number | string;
    /**
     * アップロードしたユーザー名
     */
    uploadedByUsername?: string | null;
};

