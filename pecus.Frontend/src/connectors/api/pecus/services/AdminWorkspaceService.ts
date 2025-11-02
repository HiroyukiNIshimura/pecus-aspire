/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddUserToWorkspaceRequest } from '../models/AddUserToWorkspaceRequest';
import type { CreateWorkspaceRequest } from '../models/CreateWorkspaceRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UpdateWorkspaceRequest } from '../models/UpdateWorkspaceRequest';
import type { WorkspaceDetailResponse } from '../models/WorkspaceDetailResponse';
import type { WorkspaceListItemResponseWorkspaceStatisticsPagedResponse } from '../models/WorkspaceListItemResponseWorkspaceStatisticsPagedResponse';
import type { WorkspaceResponse } from '../models/WorkspaceResponse';
import type { WorkspaceUserDetailResponseObjectPagedResponse } from '../models/WorkspaceUserDetailResponseObjectPagedResponse';
import type { WorkspaceUserResponse } from '../models/WorkspaceUserResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminWorkspaceService {
    /**
     * ワークスペース登録
     * @param requestBody
     * @returns WorkspaceResponse OK
     * @throws ApiError
     */
    public static postApiAdminWorkspaces(
        requestBody?: CreateWorkspaceRequest,
    ): CancelablePromise<WorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/workspaces',
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
     * ワークスペース一覧取得（ページネーション）
     * @param page
     * @param isActive アクティブなワークスペースのみ取得するか
     * @param genreId ジャンルIDでフィルター（オプション）
     * @param name ワークスペース名で前方一致検索（オプション）
     * @returns WorkspaceListItemResponseWorkspaceStatisticsPagedResponse OK
     * @throws ApiError
     */
    public static getApiAdminWorkspaces(
        page?: number,
        isActive?: boolean,
        genreId?: number,
        name?: string,
    ): CancelablePromise<WorkspaceListItemResponseWorkspaceStatisticsPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/workspaces',
            query: {
                'Page': page,
                'IsActive': isActive,
                'GenreId': genreId,
                'Name': name,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペース情報取得
     * @param id
     * @returns WorkspaceDetailResponse OK
     * @throws ApiError
     */
    public static getApiAdminWorkspaces1(
        id: number,
    ): CancelablePromise<WorkspaceDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/workspaces/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペース更新
     * @param id
     * @param requestBody
     * @returns WorkspaceResponse OK
     * @throws ApiError
     */
    public static putApiAdminWorkspaces(
        id: number,
        requestBody?: UpdateWorkspaceRequest,
    ): CancelablePromise<WorkspaceResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/workspaces/{id}',
            path: {
                'id': id,
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
     * ワークスペース削除
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiAdminWorkspaces(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/workspaces/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペース無効化
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static patchApiAdminWorkspacesDeactivate(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/workspaces/{id}/deactivate',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペース有効化
     * @param id
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static patchApiAdminWorkspacesActivate(
        id: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/workspaces/{id}/activate',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースにユーザーを参加させる
     * @param id
     * @param requestBody
     * @returns WorkspaceUserResponse OK
     * @throws ApiError
     */
    public static postApiAdminWorkspacesUsers(
        id: number,
        requestBody?: AddUserToWorkspaceRequest,
    ): CancelablePromise<WorkspaceUserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/workspaces/{id}/users',
            path: {
                'id': id,
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
     * ワークスペースのメンバー一覧取得（ページネーション）
     * @param id ワークスペースID
     * @param page
     * @param activeOnly
     * @returns WorkspaceUserDetailResponseObjectPagedResponse OK
     * @throws ApiError
     */
    public static getApiAdminWorkspacesUsers(
        id: number,
        page?: number,
        activeOnly?: boolean,
    ): CancelablePromise<WorkspaceUserDetailResponseObjectPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/workspaces/{id}/users',
            path: {
                'id': id,
            },
            query: {
                'Page': page,
                'ActiveOnly': activeOnly,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースからユーザーを削除
     * @param id
     * @param userId
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiAdminWorkspacesUsers(
        id: number,
        userId: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admin/workspaces/{id}/users/{userId}',
            path: {
                'id': id,
                'userId': userId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
