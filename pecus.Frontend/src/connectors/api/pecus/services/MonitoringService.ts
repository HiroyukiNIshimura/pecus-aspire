/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HangfireStatsResponse } from '../models/HangfireStatsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MonitoringService {
    /**
     * Hangfireのジョブ統計を取得します
     * @returns HangfireStatsResponse 統計情報
     * @throws ApiError
     */
    public static getApiBackendMonitoringHangfireStats(): CancelablePromise<HangfireStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/backend/monitoring/hangfire-stats',
        });
    }
}
