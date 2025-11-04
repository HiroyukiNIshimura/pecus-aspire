/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceResponse } from '../models/DeviceResponse';
import type { MessageResponse } from '../models/MessageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DeviceService {
    /**
     * 自分の有効なデバイス情報の一覧を取得
     * @returns DeviceResponse OK
     * @throws ApiError
     */
    public static getApiProfileDevices(): CancelablePromise<Array<DeviceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile/devices',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 自分のデバイスを削除
     * @param deviceId デバイスID
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static deleteApiProfileDevices(
        deviceId: number,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profile/devices/{deviceId}',
            path: {
                'deviceId': deviceId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
