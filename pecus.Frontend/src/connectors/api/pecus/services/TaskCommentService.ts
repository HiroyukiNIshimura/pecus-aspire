/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTaskCommentRequest } from '../models/CreateTaskCommentRequest';
import type { DeleteTaskCommentRequest } from '../models/DeleteTaskCommentRequest';
import type { PagedResponseOfTaskCommentDetailResponse } from '../models/PagedResponseOfTaskCommentDetailResponse';
import type { TaskCommentDetailResponse } from '../models/TaskCommentDetailResponse';
import type { TaskCommentResponse } from '../models/TaskCommentResponse';
import type { TaskCommentType } from '../models/TaskCommentType';
import type { UpdateTaskCommentRequest } from '../models/UpdateTaskCommentRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TaskCommentService {
    /**
     * コメント一覧取得
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param taskId タスクID
     * @param page ページ番号（1から始まる）
     * @param commentType コメントタイプでフィルタ
     * @param includeDeleted 削除されたコメントも含める（デフォルトはfalse）
     * @returns PagedResponseOfTaskCommentDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsTasksComments(
        workspaceId: number,
        itemId: number,
        taskId: number,
        page?: number,
        commentType?: TaskCommentType,
        includeDeleted?: boolean,
    ): CancelablePromise<PagedResponseOfTaskCommentDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks/{taskId}/comments',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'taskId': taskId,
            },
            query: {
                'Page': page,
                'CommentType': commentType,
                'IncludeDeleted': includeDeleted,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * コメント作成
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param taskId タスクID
     * @param requestBody 作成リクエスト
     * @returns TaskCommentResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesItemsTasksComments(
        workspaceId: number,
        itemId: number,
        taskId: number,
        requestBody: CreateTaskCommentRequest,
    ): CancelablePromise<TaskCommentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks/{taskId}/comments',
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
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * コメント取得
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param taskId タスクID
     * @param commentId コメントID
     * @returns TaskCommentDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsTasksComments1(
        workspaceId: number,
        itemId: number,
        taskId: number,
        commentId: number,
    ): CancelablePromise<TaskCommentDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks/{taskId}/comments/{commentId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'taskId': taskId,
                'commentId': commentId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * コメント更新（作成者のみ）
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param taskId タスクID
     * @param commentId コメントID
     * @param requestBody 更新リクエスト
     * @returns TaskCommentResponse OK
     * @throws ApiError
     */
    public static putApiWorkspacesItemsTasksComments(
        workspaceId: number,
        itemId: number,
        taskId: number,
        commentId: number,
        requestBody: UpdateTaskCommentRequest,
    ): CancelablePromise<TaskCommentResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks/{taskId}/comments/{commentId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'taskId': taskId,
                'commentId': commentId,
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
     * コメント削除（無効化、作成者のみ）
     * @param workspaceId ワークスペースID
     * @param itemId ワークスペースアイテムID
     * @param taskId タスクID
     * @param commentId コメントID
     * @param requestBody 削除リクエスト
     * @returns TaskCommentResponse OK
     * @throws ApiError
     */
    public static deleteApiWorkspacesItemsTasksComments(
        workspaceId: number,
        itemId: number,
        taskId: number,
        commentId: number,
        requestBody: DeleteTaskCommentRequest,
    ): CancelablePromise<TaskCommentResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tasks/{taskId}/comments/{commentId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'taskId': taskId,
                'commentId': commentId,
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
}
