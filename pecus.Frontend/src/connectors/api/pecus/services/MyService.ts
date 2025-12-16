/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityPeriod } from '../models/ActivityPeriod';
import type { DashboardTaskFilter } from '../models/DashboardTaskFilter';
import type { MyCommitterWorkspaceResponse } from '../models/MyCommitterWorkspaceResponse';
import type { MyItemRelationType } from '../models/MyItemRelationType';
import type { MyTaskWorkspaceResponse } from '../models/MyTaskWorkspaceResponse';
import type { OrganizationResponse } from '../models/OrganizationResponse';
import type { PagedResponseOfActivityResponse } from '../models/PagedResponseOfActivityResponse';
import type { PagedResponseOfItemWithTasksResponse } from '../models/PagedResponseOfItemWithTasksResponse';
import type { PagedResponseOfMyTaskDetailResponseAndWorkspaceTaskStatistics } from '../models/PagedResponseOfMyTaskDetailResponseAndWorkspaceTaskStatistics';
import type { PagedResponseOfWorkspaceItemDetailResponse } from '../models/PagedResponseOfWorkspaceItemDetailResponse';
import type { TasksByDueDateResponse } from '../models/TasksByDueDateResponse';
import type { TaskStatusFilter } from '../models/TaskStatusFilter';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MyService {
    /**
     * 自分のアクティビティ一覧を取得（活動レポート用）
     * @param page ページ番号（1から開始）
     * @param period 期間フィルタ（省略時は全期間）
     * @returns PagedResponseOfActivityResponse アクティビティ一覧
     * @throws ApiError
     */
    public static getApiMyActivities(
        page?: number,
        period?: ActivityPeriod,
    ): CancelablePromise<PagedResponseOfActivityResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/activities',
            query: {
                'Page': page,
                'Period': period,
            },
        });
    }
    /**
     * マイコミッターワークスペース一覧を取得
     * ログインユーザーがコミッターとして割り当てられたアイテムを持つワークスペースの一覧を取得します
     * @returns MyCommitterWorkspaceResponse OK
     * @throws ApiError
     */
    public static getApiMyCommitterWorkspaces(): CancelablePromise<Array<MyCommitterWorkspaceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/committer-workspaces',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 指定ワークスペース内のコミッタータスクを期限日グループで取得
     * ログインユーザーがコミッターとして割り当てられたアイテムに紐づくタスクを期限日でグループ化して返します
     * @param workspaceId ワークスペースID
     * @param filter ダッシュボード用フィルター（省略時はActive）
     * @returns TasksByDueDateResponse OK
     * @throws ApiError
     */
    public static getApiMyCommitterWorkspacesTasks(
        workspaceId: number,
        filter?: DashboardTaskFilter,
    ): CancelablePromise<Array<TasksByDueDateResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/committer-workspaces/{workspaceId}/tasks',
            path: {
                'workspaceId': workspaceId,
            },
            query: {
                'filter': filter,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * マイコミッターアイテム一覧を取得
     * ログインユーザーがコミッターとして割り当てられたアイテムとそのタスクを取得します
     * @param page ページ番号（1から始まる）
     * @param workspaceId ワークスペースID（任意）
     * @returns PagedResponseOfItemWithTasksResponse OK
     * @throws ApiError
     */
    public static getApiMyCommitterItems(
        page?: number,
        workspaceId?: number,
    ): CancelablePromise<PagedResponseOfItemWithTasksResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/committer-items',
            query: {
                'Page': page,
                'WorkspaceId': workspaceId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * マイアイテム一覧を取得
     * ログインユーザーがオーナー、担当者、コミッター、またはPIN済みのアイテムを取得
     * @param page ページ番号（1から開始）
     * @param relation 関連タイプ（All, Owner, Assignee, Committer, Pinned）
     * @param includeArchived アーカイブ済みアイテムを含めるかどうか（デフォルト: false）
     * true の場合、アーカイブ済みアイテムのみ表示
     * false または未指定の場合、アーカイブ済みアイテムを除外
     * @returns PagedResponseOfWorkspaceItemDetailResponse OK
     * @throws ApiError
     */
    public static getApiMyWorkspaceItems(
        page?: number,
        relation?: MyItemRelationType,
        includeArchived?: boolean,
    ): CancelablePromise<PagedResponseOfWorkspaceItemDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/workspace-items',
            query: {
                'Page': page,
                'Relation': relation,
                'IncludeArchived': includeArchived,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ログインユーザーの所属組織情報を取得
     * 組織設定（TaskOverdueThreshold など）を含んだ組織情報を返します。
     * @returns OrganizationResponse 組織情報を返します
     * @throws ApiError
     */
    public static getApiMyOrganization(): CancelablePromise<OrganizationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/organization',
            errors: {
                404: `組織に所属していない、または組織が見つかりません`,
            },
        });
    }
    /**
     * マイタスク一覧を取得
     * ログインユーザーに割り当てられたタスクを全ワークスペース横断で取得
     * @param page ページ番号（1から開始）
     * @param status ステータスフィルター（省略時はすべて表示）
     * @returns PagedResponseOfMyTaskDetailResponseAndWorkspaceTaskStatistics OK
     * @throws ApiError
     */
    public static getApiMyTasks(
        page?: number,
        status?: TaskStatusFilter,
    ): CancelablePromise<PagedResponseOfMyTaskDetailResponseAndWorkspaceTaskStatistics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/tasks',
            query: {
                'Page': page,
                'Status': status,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * マイタスクワークスペース一覧を取得
     * ログインユーザーが担当のタスクを持つワークスペースの一覧を取得します（期限日が古い順）
     * @returns MyTaskWorkspaceResponse OK
     * @throws ApiError
     */
    public static getApiMyTaskWorkspaces(): CancelablePromise<Array<MyTaskWorkspaceResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/task-workspaces',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 指定ワークスペース内のマイタスクを期限日グループで取得
     * ログインユーザーが担当のタスクを期限日でグループ化して返します
     * @param workspaceId ワークスペースID
     * @param filter ダッシュボード用フィルター（省略時はActive）
     * @returns TasksByDueDateResponse OK
     * @throws ApiError
     */
    public static getApiMyTaskWorkspacesTasks(
        workspaceId: number,
        filter?: DashboardTaskFilter,
    ): CancelablePromise<Array<TasksByDueDateResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/task-workspaces/{workspaceId}/tasks',
            path: {
                'workspaceId': workspaceId,
            },
            query: {
                'filter': filter,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ログインユーザーがPINしたアイテム一覧を取得
     * @param page ページ番号（1から開始）
     * @returns PagedResponseOfWorkspaceItemDetailResponse OK
     * @throws ApiError
     */
    public static getApiMyPinnedItems(
        page?: number,
    ): CancelablePromise<PagedResponseOfWorkspaceItemDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/pinned-items',
            query: {
                'Page': page,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
