/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchResponse } from '../models/BatchResponse';
import type { ContinuationResponse } from '../models/ContinuationResponse';
import type { JobResponse } from '../models/JobResponse';
import type { MessageResponse } from '../models/MessageResponse';
import type { RecurringResponse } from '../models/RecurringResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BackendHangfireTestService {
    /**
     * Fire-and-forget ジョブのテスト
     * @param message ログに出力するメッセージ
     * @returns JobResponse OK
     * @throws ApiError
     */
    public static postApiBackendHangfireTestFireAndForget(
        message: string = 'Hello from Hangfire!',
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backend/hangfire-test/fire-and-forget',
            query: {
                'message': message,
            },
        });
    }
    /**
     * 遅延ジョブのテスト
     * @param message ログに出力するメッセージ
     * @param delaySeconds 遅延秒数（デフォルト: 10秒）
     * @returns JobResponse OK
     * @throws ApiError
     */
    public static postApiBackendHangfireTestDelayed(
        message: string = 'Delayed job executed!',
        delaySeconds: number = 10,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backend/hangfire-test/delayed',
            query: {
                'message': message,
                'delaySeconds': delaySeconds,
            },
        });
    }
    /**
     * 継続ジョブのテスト
     * @param parentMessage 親ジョブのメッセージ
     * @param childMessage 子ジョブのメッセージ
     * @returns ContinuationResponse OK
     * @throws ApiError
     */
    public static postApiBackendHangfireTestContinuation(
        parentMessage: string = 'Parent job',
        childMessage: string = 'Child job',
    ): CancelablePromise<ContinuationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backend/hangfire-test/continuation',
            query: {
                'parentMessage': parentMessage,
                'childMessage': childMessage,
            },
        });
    }
    /**
     * 繰り返しジョブのテスト（Cron式）
     * @param message ログに出力するメッセージ
     * @param cronExpression Cron式（デフォルト: 毎分実行）
     * @returns RecurringResponse OK
     * @throws ApiError
     */
    public static postApiBackendHangfireTestRecurring(
        message: string = 'Recurring job executed!',
        cronExpression: string = '* * * * *',
    ): CancelablePromise<RecurringResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backend/hangfire-test/recurring',
            query: {
                'message': message,
                'cronExpression': cronExpression,
            },
        });
    }
    /**
     * 繰り返しジョブの削除
     * @param recurringJobId 削除する繰り返しジョブID
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static deleteApiBackendHangfireTestRecurring(
        recurringJobId: string,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/backend/hangfire-test/recurring/{recurringJobId}',
            path: {
                'recurringJobId': recurringJobId,
            },
        });
    }
    /**
     * 失敗したジョブを削除
     * @param jobId 削除するジョブID
     * @returns MessageResponse OK
     * @throws ApiError
     */
    public static deleteApiBackendHangfireTestFailed(
        jobId: string,
    ): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/backend/hangfire-test/failed/{jobId}',
            path: {
                'jobId': jobId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * 長時間実行ジョブのテスト
     * @param durationSeconds 実行時間（秒）
     * @returns JobResponse OK
     * @throws ApiError
     */
    public static postApiBackendHangfireTestLongRunning(
        durationSeconds: number = 30,
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backend/hangfire-test/long-running',
            query: {
                'durationSeconds': durationSeconds,
            },
        });
    }
    /**
     * エラーを発生させるジョブのテスト
     * @param errorMessage エラーメッセージ
     * @returns JobResponse OK
     * @throws ApiError
     */
    public static postApiBackendHangfireTestError(
        errorMessage: string = 'Test error',
    ): CancelablePromise<JobResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backend/hangfire-test/error',
            query: {
                'errorMessage': errorMessage,
            },
        });
    }
    /**
     * バッチジョブのテスト
     * @param count ジョブ数
     * @returns BatchResponse OK
     * @throws ApiError
     */
    public static postApiBackendHangfireTestBatch(
        count: number = 5,
    ): CancelablePromise<BatchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/backend/hangfire-test/batch',
            query: {
                'count': count,
            },
        });
    }
}
