/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ItemWithTasksResponsePagedResponse } from '../models/ItemWithTasksResponsePagedResponse';
import type { MyCommitterWorkspaceResponse } from '../models/MyCommitterWorkspaceResponse';
import type { MyItemRelationType } from '../models/MyItemRelationType';
import type { MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse } from '../models/MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse';
import type { MyTaskWorkspaceResponse } from '../models/MyTaskWorkspaceResponse';
import type { TasksByDueDateResponse } from '../models/TasksByDueDateResponse';
import type { TaskStatusFilter } from '../models/TaskStatusFilter';
import type { WorkspaceItemDetailResponsePagedResponse } from '../models/WorkspaceItemDetailResponsePagedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MyService {
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
     * @returns TasksByDueDateResponse OK
     * @throws ApiError
     */
    public static getApiMyCommitterWorkspacesTasks(
        workspaceId: number,
    ): CancelablePromise<Array<TasksByDueDateResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/committer-workspaces/{workspaceId}/tasks',
            path: {
                'workspaceId': workspaceId,
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
     * @returns ItemWithTasksResponsePagedResponse OK
     * @throws ApiError
     */
    public static getApiMyCommitterItems(
        page?: number,
        workspaceId?: number,
    ): CancelablePromise<ItemWithTasksResponsePagedResponse> {
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
     * @returns WorkspaceItemDetailResponsePagedResponse OK
     * @throws ApiError
     */
    public static getApiMyWorkspaceItems(
        page?: number,
        relation?: MyItemRelationType,
        includeArchived?: boolean,
    ): CancelablePromise<WorkspaceItemDetailResponsePagedResponse> {
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
     * マイタスク一覧を取得
     * ログインユーザーに割り当てられたタスクを全ワークスペース横断で取得
     * @param page ページ番号（1から開始）
     * @param status ステータスフィルター（省略時はすべて表示）
     * @returns MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse OK
     * @throws ApiError
     */
    public static getApiMyTasks(
        page?: number,
        status?: TaskStatusFilter,
    ): CancelablePromise<MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse> {
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
     * @returns TasksByDueDateResponse OK
     * @throws ApiError
     */
    public static getApiMyTaskWorkspacesTasks(
        workspaceId: number,
    ): CancelablePromise<Array<TasksByDueDateResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/my/task-workspaces/{workspaceId}/tasks',
            path: {
                'workspaceId': workspaceId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
