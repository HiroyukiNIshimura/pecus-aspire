/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileType } from '../models/FileType';
import type { FileUploadResponse } from '../models/FileUploadResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FileService {
    /**
     * アイコンファイルを取得（画像を返す）
     * @param fileType ファイルの種類（avatar, genre）
     * @param resourceId リソースID（ユーザーIDまたはジャンルID）
     * @param fileName ファイル名
     * @returns any OK
     * @throws ApiError
     */
    public static getApiDownloadsIcons(
        fileType: FileType,
        resourceId: number,
        fileName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
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
