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
     * @param fileType ファイルの種類（avatar, genre）
     * @param resourceId リソースID
     * @param formData
     * @returns FileUploadResponse OK
     * @throws ApiError
     */
    public static postApiFiles(
        fileType: string,
        resourceId: number,
        formData?: {
            /**
             * アップロードするファイル
             */
            file?: Blob;
        },
    ): CancelablePromise<FileUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/files/{fileType}/{resourceId}',
            path: {
                'fileType': fileType,
                'resourceId': resourceId,
            },
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
