/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileType } from '../models/FileType';
import type { FileUploadResponse } from '../models/FileUploadResponse';
import type { MessageResponse } from '../models/MessageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FileService {
    /**
     * ファイルを取得（ルートベース）
     * ファイル名にはドット（.）が含まれるため、catch-all パラメータ（*fileName）を使用して
     * ルート末尾のすべての文字（ドットを含む）をキャプチャします。
     * これにより image.jpg のようなファイル名も正しく処理されます。
     * @param fileType ファイル種別（avatar, genre）
     * @param resourceId リソースID（ユーザーIDまたはジャンルID）
     * @param fileName ファイル名
     * @param useOriginal 元画像（リサイズ前）を取得するかどうか
     * @returns any OK
     * @throws ApiError
     */
    public static getApiDownloads(
        fileType: string,
        resourceId: number,
        fileName: string,
        useOriginal: boolean = false,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/downloads/{fileType}/{resourceId}/{fileName}',
            path: {
                'fileType': fileType,
                'resourceId': resourceId,
                'fileName': fileName,
            },
            query: {
                'useOriginal': useOriginal,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * アイコンファイルを取得（画像を返す）- クエリパラメータ版（後方互換性のため維持）
     * @param fileType ファイルの種類（avatar, genre）
     * @param resourceId リソースID（ユーザーIDまたはジャンルID）
     * @param fileName ファイル名
     * @param useOriginal 元画像（リサイズ前）を取得するかどうか
     * @returns any OK
     * @throws ApiError
     */
    public static getApiDownloadsIcons(
        fileType: FileType,
        resourceId: number,
        fileName: string,
        useOriginal?: boolean,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/downloads/icons',
            query: {
                'FileType': fileType,
                'ResourceId': resourceId,
                'FileName': fileName,
                'UseOriginal': useOriginal,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * アイコンファイルを削除
     * @param fileType ファイルの種類（avatar, genre）
     * @param resourceId リソースID（ユーザーIDまたはジャンルID）
     * @param fileName ファイル名
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static deleteApiDownloadsIcons(
        fileType: FileType,
        resourceId: number,
        fileName: string,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/downloads/icons',
            query: {
                'FileType': fileType,
                'ResourceId': resourceId,
                'FileName': fileName,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * ファイルをアップロード
     * @param formData
     * @returns FileUploadResponse OK
     * @throws ApiError
     */
    public static postApiFiles(
        formData?: {
            FileType: FileType;
            /**
             * リソースID（ユーザーIDまたはジャンルID）
             */
            ResourceId: number;
            /**
             * アップロードするファイル
             */
            File: Blob;
        },
    ): CancelablePromise<FileUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/files',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                500: `Internal Server Error`,
            },
        });
    }
}
