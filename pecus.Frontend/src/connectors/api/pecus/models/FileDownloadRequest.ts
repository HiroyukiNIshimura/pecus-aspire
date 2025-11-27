/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileType } from './FileType';
/**
 * ファイルダウンロード用のリクエストDTO
 * ルートおよびクエリからのバインドを想定しています。
 */
export type FileDownloadRequest = {
    fileType: FileType;
    /**
     * リソースID（ユーザーIDまたはジャンルID）
     */
    resourceId?: number;
    /**
     * ファイル名（拡張子含む）。catch-allパラメータで受け取ります。
     */
    fileName: string;
    /**
     * 元画像（リサイズ前）を取得するかどうか（クエリ）
     */
    useOriginal?: boolean;
};

