/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 一時添付ファイルのレスポンス
 */
export type TempAttachmentResponse = {
    /**
     * 一時ファイルID（UUID形式）
     */
    tempFileId: string;
    /**
     * セッションID
     */
    sessionId: string;
    /**
     * 元のファイル名
     */
    fileName: string;
    /**
     * ファイルサイズ（バイト）
     */
    fileSize: number | string;
    /**
     * MIMEタイプ
     */
    mimeType: string;
    /**
     * 一時ファイルのプレビューURL
     */
    previewUrl: string;
};

