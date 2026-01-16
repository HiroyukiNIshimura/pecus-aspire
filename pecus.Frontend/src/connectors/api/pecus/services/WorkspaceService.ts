/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddUserToWorkspaceRequest } from '../models/AddUserToWorkspaceRequest';
import type { CreateWorkspaceRequest } from '../models/CreateWorkspaceRequest';
import type { DashboardTaskTrendResponse } from '../models/DashboardTaskTrendResponse';
import type { DocumentTreeResponse } from '../models/DocumentTreeResponse';
import type { PagedResponseOfWorkspaceListItemResponse } from '../models/PagedResponseOfWorkspaceListItemResponse';
import type { SetWorkspaceSkillsRequest } from '../models/SetWorkspaceSkillsRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UpdateWorkspaceRequest } from '../models/UpdateWorkspaceRequest';
import type { UpdateWorkspaceUserRoleRequest } from '../models/UpdateWorkspaceUserRoleRequest';
import type { UserSearchResultResponse } from '../models/UserSearchResultResponse';
import type { WorkspaceFullDetailResponse } from '../models/WorkspaceFullDetailResponse';
import type { WorkspaceStatistics } from '../models/WorkspaceStatistics';
import type { WorkspaceUserDetailResponse } from '../models/WorkspaceUserDetailResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceService {
    /**
     * ドキュメントツリーを取得
     * ワークスペース内の全アイテムと親子関係を解決して返す
     * このエンドポイントはドキュメントモードのワークスペースでのみ使用可能です。
     * 通常モードのワークスペースで呼び出すと 400 Bad Request が返されます。
     * @param workspaceId
     * @returns DocumentTreeResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesDocumentTree(
        workspaceId: number,
    ): CancelablePromise<DocumentTreeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/document-tree',
            path: {
                'workspaceId': workspaceId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * ワークスペースを新規作成する
     * @param requestBody ワークスペース作成リクエスト
     * @returns WorkspaceFullDetailResponse Created
     * @throws ApiError
     */
    public static postApiWorkspaces(
        requestBody: CreateWorkspaceRequest,
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
     * ログインユーザーがアクセス可能なワークスペース一覧を取得する（ページネーション）
     * @param page
     * @param genreId
     * @param name
     * @returns PagedResponseOfWorkspaceListItemResponse OK
     * @throws ApiError
     */
    public static getApiWorkspaces(
        page?: number,
        genreId?: number,
        name?: string,
    ): CancelablePromise<PagedResponseOfWorkspaceListItemResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces',
            query: {
                'Page': page,
                'GenreId': genreId,
                'Name': name,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペース情報を更新する（Member以上の権限が必要）
     * @param id ワークスペースID
     * @param requestBody ワークスペース更新リクエスト
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static putApiWorkspaces(
        id: number,
        requestBody: UpdateWorkspaceRequest,
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
     * ワークスペースの詳細情報を取得する（ログインユーザーがアクセス可能なもののみ）
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
     * ワークスペースを削除する（Admin権限が必要）
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
     * ログインユーザーがアクセス可能なワークスペースの統計情報を取得する
     * @returns WorkspaceStatistics OK
     * @throws ApiError
     */
    public static getApiWorkspacesStatistics(): CancelablePromise<WorkspaceStatistics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/statistics',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースの詳細情報を取得する（codeベース：ログインユーザーがアクセス可能なもののみ）
     * @param code ワークスペースコード
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesCode(
        code: string,
    ): CancelablePromise<WorkspaceFullDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/code/{code}',
            path: {
                'code': code,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースにメンバーを追加する（Ownerのみ実行可能）
     * @param id ワークスペースID
     * @param requestBody メンバー追加リクエスト
     * @returns WorkspaceUserDetailResponse Created
     * @throws ApiError
     */
    public static postApiWorkspacesMembers(
        id: number,
        requestBody: AddUserToWorkspaceRequest,
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
     * ワークスペースからメンバーを削除する（Ownerまたは自分自身の場合のみ実行可能）
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
     * ワークスペースメンバーのロールを変更する（Ownerのみ実行可能）
     * ワークスペースの Owner ロールを持つユーザーのみ実行可能です。
     * ただし、Workspace.OwnerId のユーザーを Owner 以外のロールに変更することはできません。
     * また、Viewer に変更する場合、対象ユーザーが担当中のタスクやアイテムがあると変更できません。
     * @param id ワークスペースID
     * @param userId 対象ユーザーID
     * @param requestBody ロール変更リクエスト
     * @returns WorkspaceUserDetailResponse OK
     * @throws ApiError
     */
    public static patchApiWorkspacesMembersRole(
        id: number,
        userId: number,
        requestBody: UpdateWorkspaceUserRoleRequest,
    ): CancelablePromise<WorkspaceUserDetailResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/workspaces/{id}/members/{userId}/role',
            path: {
                'id': id,
                'userId': userId,
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
     * ワークスペースのメンバーをあいまい検索する
     * ワークスペースに参加しているメンバーの中から、ユーザー名またはメールアドレスで
     * あいまい検索を行います。pgroonga を使用しているため、日本語の漢字のゆらぎや
     * タイポにも対応します。
     *
     * タスクの担当者選択など、編集権限が必要な場面では excludeViewer=true を指定して
     * Viewer ロールのメンバーを除外できます。
     * @param id ワークスペースID
     * @param q 検索クエリ（2文字以上100文字以内）
     * @param limit 取得件数上限（1〜50、デフォルト20）
     * @param excludeViewer Viewerロールを除外するかどうか（デフォルト: false）
     * @returns UserSearchResultResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesMembersSearch(
        id: number,
        q?: string,
        limit?: number,
        excludeViewer?: boolean,
    ): CancelablePromise<Array<UserSearchResultResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{id}/members/search',
            path: {
                'id': id,
            },
            query: {
                'Q': q,
                'Limit': limit,
                'ExcludeViewer': excludeViewer,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
            },
        });
    }
    /**
     * ワークスペースを有効化する（Ownerのみ実行可能）
     * @param id ワークスペースID
     * @param requestBody 楽観的ロック用のバージョン番号
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesActivate(
        id: number,
        requestBody: number,
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
     * ワークスペースを無効化する（Ownerのみ実行可能）
     * @param id ワークスペースID
     * @param requestBody 楽観的ロック用のバージョン番号
     * @returns WorkspaceFullDetailResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesDeactivate(
        id: number,
        requestBody: number,
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
    /**
     * ワークスペースのスキルを設定する（Ownerのみ実行可能）
     * ワークスペースが必要とするスキルを設定します（洗い替え）。
     * 指定されたスキル以外のスキルは削除されます。
     * @param id ワークスペースID
     * @param requestBody スキルIDのリスト
     * @returns SuccessResponse スキルを設定しました
     * @throws ApiError
     */
    public static putApiWorkspacesSkills(
        id: number,
        requestBody: SetWorkspaceSkillsRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workspaces/{id}/skills',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `リクエストが無効です`,
                404: `ワークスペースが見つかりません`,
                409: `競合: ワークスペース情報が別のユーザーにより更新されています`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースの週次タスクトレンドを取得（Viewer以上の権限が必要）
     * @param id ワークスペースID
     * @param weeks 取得する週数（4〜12週、デフォルト8週）
     * @returns DashboardTaskTrendResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesTaskTrend(
        id: number,
        weeks: number = 8,
    ): CancelablePromise<DashboardTaskTrendResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{id}/task-trend',
            path: {
                'id': id,
            },
            query: {
                'weeks': weeks,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
