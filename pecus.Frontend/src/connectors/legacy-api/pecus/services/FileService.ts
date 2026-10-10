/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileType } from '../models/FileType';
import type { FileUploadResponse } from '../models/FileUploadResponse';
import type { IFormFile } from '../models/IFormFile';
import type { MessageResponse } from '../models/MessageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FileService {
    /**
     * ファイルを取得（ルートベース）
     * @param fileType ファイル種別（avatar, genre）
     * @param resourceId リソースID（ユーザーIDまたはジャンルID）
     * @param fileName ファイル名（拡張子含む）。catch-allパラメータで受け取ります。
     * @param useOriginal 元画像（リサイズ前）を取得するかどうか（クエリパラメータ）
     * @returns any OK
     * @throws ApiError
     */
    public static getApiDownloads(
        fileType: FileType,
        resourceId: number,
        fileName: string,
        useOriginal?: boolean,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/downloads/{FileType}/{ResourceId}/{FileName}',
            path: {
                'FileType': fileType,
                'ResourceId': resourceId,
                'FileName': fileName,
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
     * アイコンファイルを削除
     * @param fileType ファイルの種類（avatar, genre）
     * @param resourceId リソースID（ユーザーIDまたはジャンルID）
     * @param fileName ファイル名
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static deleteApiDownloadsIcons(
        fileType?: FileType,
        resourceId?: number,
        fileName?: string,
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
     * @param formData アップロードするファイル
     * @returns FileUploadResponse OK
     * @throws ApiError
     */
    public static postApiFiles(
        formData: {
            FileType?: FileType;
            ResourceId?: number;
            File?: IFormFile;
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
