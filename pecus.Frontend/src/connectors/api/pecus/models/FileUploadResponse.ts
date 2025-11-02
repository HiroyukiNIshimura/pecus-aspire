/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ファイルアップロードレスポンス
 */
export type FileUploadResponse = {
  /**
   * アップロード成功フラグ
   */
  success?: boolean;
  /**
   * ファイルURL（公開アクセス用）
   */
  fileUrl?: string | null;
  /**
   * ファイルサイズ（バイト）
   */
  fileSize?: number;
  /**
   * ファイル形式
   */
  contentType?: string | null;
  /**
   * アップロード日時
   */
  uploadedAt?: string;
  /**
   * メッセージ
   */
  message?: string | null;
};
