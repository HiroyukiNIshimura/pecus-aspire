/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateExternalApiKeyRequest } from '../models/CreateExternalApiKeyRequest';
import type { CreateExternalApiKeyResponse } from '../models/CreateExternalApiKeyResponse';
import type { ExternalApiKeyResponse } from '../models/ExternalApiKeyResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminExternalApiKeysService {
    /**
     * 自組織のAPIキー一覧を取得
     * @returns ExternalApiKeyResponse OK
     * @throws ApiError
     */
    public static getApiAdminExternalApiKeys(): CancelablePromise<Array<ExternalApiKeyResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/external-api-keys',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * APIキーを新規発行
     * 平文キー（rawKey）はこのレスポンスでのみ取得可能です。
     * 以降は先頭8文字（keyPrefix）のみ表示されます。
     * @param requestBody
     * @returns CreateExternalApiKeyResponse Created
     * @throws ApiError
     */
    public static postApiAdminExternalApiKeys(
        requestBody: CreateExternalApiKeyRequest,
    ): CancelablePromise<CreateExternalApiKeyResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/external-api-keys',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * APIキーを失効させる
     * 失効したAPIキーは即座に無効化されます。この操作は取り消せません。
     * @param keyId
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiAdminExternalApiKeys(
        keyId: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/external-api-keys/{keyId}',
            path: {
                'keyId': keyId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
