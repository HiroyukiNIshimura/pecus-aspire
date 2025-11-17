/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddUserToWorkspaceRequest } from '../models/AddUserToWorkspaceRequest';
import type { CreateWorkspaceRequest } from '../models/CreateWorkspaceRequest';
import type { UpdateWorkspaceRequest } from '../models/UpdateWorkspaceRequest';
import type { WorkspaceFullDetailResponse } from '../models/WorkspaceFullDetailResponse';
import type { WorkspaceItemListPagedResponse } from '../models/WorkspaceItemListPagedResponse';
import type { WorkspaceListItemResponseWorkspaceStatisticsPagedResponse } from '../models/WorkspaceListItemResponseWorkspaceStatisticsPagedResponse';
import type { WorkspaceUserDetailResponse } from '../models/WorkspaceUserDetailResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceService {
    /**
     * ワークスペース新規作成
     * @param requestBody ワークスペース作成リクエスト
     * @returns WorkspaceFullDetailResponse Created
     * @throws ApiError
     */
    public static postApiWorkspaces(
        requestBody?: CreateWorkspaceRequest,
    ): CancelablePromise<WorkspaceFullDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces',
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
     * ログインユーザーがアクセス可能なワークスペース一覧取得（ページネーション）
     * @param page
     * @param isActive
     * @param genreId
     * @param name
     * @returns WorkspaceListItemResponseWorkspaceStatisticsPagedResponse OK
     * @throws ApiError
     */
    public static getApiWorkspaces(
        page?: number,
        isActive?: boolean,
        genreId?: number,
        name?: string,
    ): CancelablePromise<WorkspaceListItemResponseWorkspaceStatisticsPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces',
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
     * ワークスペース情報を更新（Ownerのみ実行可能）
     * @param id ワークスペースID
     * @param requestBody ワークスペース更新リクエスト
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static putApiWorkspaces(
        id: number,
        requestBody?: UpdateWorkspaceRequest,
    ): CancelablePromise<WorkspaceFullDetailResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workspaces/{id}',
            path: {
                'id': id,
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
     * ワークスペース詳細情報取得（ログインユーザーがアクセス可能なもののみ）
     * @param id ワークスペースID
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspaces1(
        id: number,
    ): CancelablePromise<WorkspaceFullDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{id}',
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
     * ワークスペースを削除（Ownerのみ実行可能）
     * @param id ワークスペースID
     * @returns void
     * @throws ApiError
     */
    public static deleteApiWorkspaces(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{id}',
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
     * ワークスペース内のアイテム一覧取得（有効なアイテムのみ、ページング対応）
     * @param id ワークスペースID
     * @param page ページ番号（1から始まる）
     * @returns WorkspaceItemListPagedResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItems(
        id: number,
        page?: number,
    ): CancelablePromise<WorkspaceItemListPagedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{id}/items',
            path: {
                'id': id,
            },
            query: {
                'Page': page,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースにメンバーを追加（Ownerのみ実行可能）
     * @param id ワークスペースID
     * @param requestBody メンバー追加リクエスト
     * @returns WorkspaceUserDetailResponse Created
     * @throws ApiError
     */
    public static postApiWorkspacesMembers(
        id: number,
        requestBody?: AddUserToWorkspaceRequest,
    ): CancelablePromise<WorkspaceUserDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{id}/members',
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
     * ワークスペースからメンバーを削除（Ownerまたは自分自身の場合のみ実行可能）
     * @param id ワークスペースID
     * @param userId 削除するユーザーID
     * @returns void
     * @throws ApiError
     */
    public static deleteApiWorkspacesMembers(
        id: number,
        userId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{id}/members/{userId}',
            path: {
                'id': id,
                'userId': userId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースを有効化（Ownerのみ実行可能）
     * @param id ワークスペースID
     * @param requestBody 楽観的ロック用バージョン番号
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesActivate(
        id: number,
        requestBody?: number,
    ): CancelablePromise<WorkspaceFullDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{id}/activate',
            path: {
                'id': id,
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
     * ワークスペースを無効化（Ownerのみ実行可能）
     * @param id ワークスペースID
     * @param requestBody 楽観的ロック用バージョン番号
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesDeactivate(
        id: number,
        requestBody?: number,
    ): CancelablePromise<WorkspaceFullDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{id}/deactivate',
            path: {
                'id': id,
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
