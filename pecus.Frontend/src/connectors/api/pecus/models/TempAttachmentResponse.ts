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
    tempFileId: string | null;
    /**
     * セッションID
     */
    sessionId: string | null;
    /**
     * 元のファイル名
     */
    fileName: string | null;
    /**
     * ファイルサイズ（バイト）
     */
    fileSize: number;
    /**
     * MIMEタイプ
     */
    mimeType: string | null;
    /**
     * 一時ファイルのプレビューURL
     */
    previewUrl: string | null;
};

