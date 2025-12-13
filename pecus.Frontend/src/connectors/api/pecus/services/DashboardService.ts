/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardHotItemsResponse } from '../models/DashboardHotItemsResponse';
import type { DashboardHotWorkspacesResponse } from '../models/DashboardHotWorkspacesResponse';
import type { DashboardPersonalSummaryResponse } from '../models/DashboardPersonalSummaryResponse';
import type { DashboardSummaryResponse } from '../models/DashboardSummaryResponse';
import type { DashboardTasksByPriorityResponse } from '../models/DashboardTasksByPriorityResponse';
import type { DashboardTaskTrendResponse } from '../models/DashboardTaskTrendResponse';
import type { DashboardWorkspaceBreakdownResponse } from '../models/DashboardWorkspaceBreakdownResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * 組織のダッシュボードサマリを取得
     * タスクとアイテムの現在状態を集計したサマリ情報
     * @returns DashboardSummaryResponse OK
     * @throws ApiError
     */
    public static getApiDashboardSummary(): CancelablePromise<DashboardSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/summary',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 組織の優先度別タスク数を取得
     * 進行中タスクの優先度別内訳
     * @returns DashboardTasksByPriorityResponse OK
     * @throws ApiError
     */
    public static getApiDashboardTasksByPriority(): CancelablePromise<DashboardTasksByPriorityResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/tasks/by-priority',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 個人のダッシュボードサマリを取得
     * ログインユーザー自身のタスク状況
     * @returns DashboardPersonalSummaryResponse OK
     * @throws ApiError
     */
    public static getApiDashboardPersonalSummary(): CancelablePromise<DashboardPersonalSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/personal/summary',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペース別統計を取得
     * 組織内の各ワークスペースのタスク・アイテム状況
     * @returns DashboardWorkspaceBreakdownResponse OK
     * @throws ApiError
     */
    public static getApiDashboardWorkspaces(): CancelablePromise<DashboardWorkspaceBreakdownResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/workspaces',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 週次タスクトレンドを取得
     * タスクの作成数/完了数の週次推移
     * @param weeks 取得する週数（1-12、デフォルト8）
     * @returns DashboardTaskTrendResponse OK
     * @throws ApiError
     */
    public static getApiDashboardTasksTrend(
        weeks: number = 8,
    ): CancelablePromise<DashboardTaskTrendResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/tasks/trend',
            query: {
                'weeks': weeks,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ホットアイテムを取得
     * 直近でアクティビティが多いアイテムのランキング
     * @param period 集計期間（"24h" または "1week"、デフォルト "24h"）
     * @param limit 取得件数（1-20、デフォルト10）
     * @returns DashboardHotItemsResponse OK
     * @throws ApiError
     */
    public static getApiDashboardHotItems(
        period: string = '24h',
        limit: number = 10,
    ): CancelablePromise<DashboardHotItemsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/hot-items',
            query: {
                'period': period,
                'limit': limit,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ホットワークスペースを取得
     * タスク関連アクティビティが活発なワークスペースのランキング
     * @param period 集計期間（"24h" または "1week"、デフォルト "24h"）
     * @param limit 取得件数（1-20、デフォルト10）
     * @returns DashboardHotWorkspacesResponse OK
     * @throws ApiError
     */
    public static getApiDashboardHotWorkspaces(
        period: string = '24h',
        limit: number = 10,
    ): CancelablePromise<DashboardHotWorkspacesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/hot-workspaces',
            query: {
                'period': period,
                'limit': limit,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
