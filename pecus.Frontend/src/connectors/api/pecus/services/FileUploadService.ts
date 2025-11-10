/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileUploadResponse } from '../models/FileUploadResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FileUploadService {
    /**
     * ファイルをアップロード
     * @param formData
     * @returns FileUploadResponse OK
     * @throws ApiError
     */
    public static postApiFiles(
        formData?: {
            /**
             * ファイルの種類（avatar, genre）
             */
            FileType: string;
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
