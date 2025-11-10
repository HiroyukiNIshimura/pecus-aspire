/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FileDownloadService {
    /**
     * アイコンファイルを取得（画像を返す）
     * @param fileType ファイルの種類（avatar, genre）
     * @param resourceId リソースID（ユーザーIDまたはジャンルID）
     * @param fileName ファイル名
     * @returns any OK
     * @throws ApiError
     */
    public static getApiDownloads(
        fileType: string,
        resourceId: number,
        fileName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/downloads/{fileType}/{resourceId}/{fileName}',
            path: {
                'FileType': fileType,
                'ResourceId': resourceId,
                'FileName': fileName,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
