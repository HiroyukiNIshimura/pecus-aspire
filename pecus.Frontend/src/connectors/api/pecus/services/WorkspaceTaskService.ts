/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssigneeTaskLoadResponse } from '../models/AssigneeTaskLoadResponse';
import type { CreateWorkspaceTaskRequest } from '../models/CreateWorkspaceTaskRequest';
import type { TaskStatusFilter } from '../models/TaskStatusFilter';
import type { UpdateWorkspaceTaskRequest } from '../models/UpdateWorkspaceTaskRequest';
import type { WorkspaceTaskDetailResponse } from '../models/WorkspaceTaskDetailResponse';
import type { WorkspaceTaskDetailResponseWorkspaceTaskStatisticsPagedResponse } from '../models/WorkspaceTaskDetailResponseWorkspaceTaskStatisticsPagedResponse';
import type { WorkspaceTaskResponse } from '../models/WorkspaceTaskResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceTaskService {
    /**
     * タスク作成
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param requestBody 作成リクエスト
     * @returns WorkspaceTaskResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesItemsTasks(
        workspaceId: number,
        itemId: number,
        requestBody?: CreateWorkspaceTaskRequest,
    ): CancelablePromise<WorkspaceTaskResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * アイテムのタスク一覧取得
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param page ページ番号（1から始まる）
     * @param pageSize 1ページあたりの件数（1〜50、デフォルト10）
     * カルーセルのためクライアントからの指定を許可
     * @param status タスクのステータスフィルター（省略時はすべて表示）
     * @param assignedUserId 担当ユーザーIDでフィルタ
     * @returns WorkspaceTaskDetailResponseWorkspaceTaskStatisticsPagedResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsTasks(
        workspaceId: number,
        itemId: number,
        page?: number,
        pageSize?: number,
        status?: TaskStatusFilter,
        assignedUserId?: number,
    ): CancelablePromise<WorkspaceTaskDetailResponseWorkspaceTaskStatisticsPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            query: {
                'Page': page,
                'PageSize': pageSize,
                'Status': status,
                'AssignedUserId': assignedUserId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * タスク取得
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param taskId タスクID
     * @returns WorkspaceTaskDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsTasks1(
        workspaceId: number,
        itemId: number,
        taskId: number,
    ): CancelablePromise<WorkspaceTaskDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks/{taskId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'taskId': taskId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * タスク更新
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param taskId タスクID
     * @param requestBody 更新リクエスト
     * @returns WorkspaceTaskResponse OK
     * @throws ApiError
     */
    public static putApiWorkspacesItemsTasks(
        workspaceId: number,
        itemId: number,
        taskId: number,
        requestBody?: UpdateWorkspaceTaskRequest,
    ): CancelablePromise<WorkspaceTaskResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks/{taskId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'taskId': taskId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                409: `Conflict`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 担当者のタスク負荷を期限日ごとにチェック
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param assignedUserId 担当ユーザーID
     * @param dueDate 期限日時（ISO 8601 形式）
     * @returns AssigneeTaskLoadResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsTasksAssigneeLoadCheck(
        workspaceId: number,
        itemId: number,
        assignedUserId: number,
        dueDate: string,
    ): CancelablePromise<AssigneeTaskLoadResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks/assignee-load-check',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            query: {
                'AssignedUserId': assignedUserId,
                'DueDate': dueDate,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
