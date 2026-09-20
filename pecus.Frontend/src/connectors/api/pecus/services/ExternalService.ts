/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalItemListResponse } from '../models/ExternalItemListResponse';
import type { ExternalItemResponse } from '../models/ExternalItemResponse';
import type { ExternalTaskCommentListResponse } from '../models/ExternalTaskCommentListResponse';
import type { ExternalWorkspaceTaskDetailResponse } from '../models/ExternalWorkspaceTaskDetailResponse';
import type { ExternalWorkspaceTaskListResponse } from '../models/ExternalWorkspaceTaskListResponse';
import type { PingRequest } from '../models/PingRequest';
import type { PingResponse } from '../models/PingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExternalService {
    /**
     * 疎通確認用エンドポイント
     * 受け取ったメッセージをそのまま返却します。
     * APIキー認証の疎通確認に使用してください。
     * @param requestBody
     * @returns PingResponse OK
     * @throws ApiError
     */
    public static postApiExternalPing(
        requestBody: PingRequest,
    ): CancelablePromise<PingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/external/ping',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * 指定ワークスペース内の全アイテムを取得する
     * ページネーション（1ページあたり20件固定）に対応しています。
     * アクティブフラグ（isActive）、アーカイブフラグ（isArchived）、下書きフラグ（isDraft）でのフィルタリングが可能です。
     * 認証された API キーの組織に属するワークスペースのみアクセス可能です。
     * @param workspaceIdOrCode ワークスペースIDまたはコード
     * @param page ページ番号（1始まり、省略時は1）
     * @param isActive アクティブフラグフィルタ（nullの場合は全件）
     * @param isArchived アーカイブフラグフィルタ（nullの場合は全件）
     * @param isDraft 下書きフラグフィルタ（nullの場合は全件）
     * @returns ExternalItemListResponse アイテム一覧の取得に成功
     * @throws ApiError
     */
    public static getApiExternalWorkspacesItems(
        workspaceIdOrCode: string,
        page: number = 1,
        isActive?: boolean,
        isArchived?: boolean,
        isDraft?: boolean,
    ): CancelablePromise<ExternalItemListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/external/workspaces/{workspaceIdOrCode}/items',
            path: {
                'workspaceIdOrCode': workspaceIdOrCode,
            },
            query: {
                'page': page,
                'isActive': isActive,
                'isArchived': isArchived,
                'isDraft': isDraft,
            },
            errors: {
                401: `認証エラー`,
                404: `ワークスペースが見つからない`,
            },
        });
    }
    /**
     * 指定ワークスペース内の指定アイテムを取得する
     * ワークスペースIDまたはコードとアイテム番号（ワークスペース内連番）を指定してアイテム情報を取得します。
     * 本文は Markdown 形式に変換されて返却されます。
     * 認証された API キーの組織に属するワークスペース・アイテムのみアクセス可能です。
     * @param workspaceIdOrCode ワークスペースIDまたはコード
     * @param itemNumber アイテム番号（ワークスペース内連番）
     * @returns ExternalItemResponse アイテムの取得に成功
     * @throws ApiError
     */
    public static getApiExternalWorkspacesItems1(
        workspaceIdOrCode: string,
        itemNumber: number,
    ): CancelablePromise<ExternalItemResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/external/workspaces/{workspaceIdOrCode}/items/{itemNumber}',
            path: {
                'workspaceIdOrCode': workspaceIdOrCode,
                'itemNumber': itemNumber,
            },
            errors: {
                401: `認証エラー`,
                404: `ワークスペースまたはアイテムが見つからない`,
            },
        });
    }
    /**
     * 指定ワークスペース・アイテム内のタスク一覧を取得する
     * 指定されたワークスペースおよびアイテムに紐づくタスクの一覧を取得します。
     * 完了状態（isCompleted）や破棄状態（isDiscarded）によるフィルタリングが可能です。
     * 認証された API キーの組織に属するワークスペース・アイテムのみアクセス可能です。
     * @param workspaceIdOrCode ワークスペースIDまたはコード
     * @param itemNumber アイテム番号（ワークスペース内連番）
     * @param isCompleted 完了フラグフィルタ（nullの場合は全件）
     * @param isDiscarded 破棄フラグフィルタ（nullの場合は全件）
     * @returns ExternalWorkspaceTaskListResponse タスク一覧の取得に成功
     * @throws ApiError
     */
    public static getApiExternalWorkspacesItemsTasks(
        workspaceIdOrCode: string,
        itemNumber: number,
        isCompleted?: boolean,
        isDiscarded?: boolean,
    ): CancelablePromise<ExternalWorkspaceTaskListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/external/workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks',
            path: {
                'workspaceIdOrCode': workspaceIdOrCode,
                'itemNumber': itemNumber,
            },
            query: {
                'isCompleted': isCompleted,
                'isDiscarded': isDiscarded,
            },
            errors: {
                401: `認証エラー`,
                404: `ワークスペースまたはアイテムが見つからない`,
            },
        });
    }
    /**
     * 指定ワークスペース・アイテム内の指定タスクを取得する
     * ワークスペースIDまたはコード、アイテム番号、タスクシーケンス番号を指定してタスク詳細を取得します。
     * 認証された API キーの組織に属するワークスペース・アイテム・タスクのみアクセス可能です。
     * @param workspaceIdOrCode ワークスペースIDまたはコード
     * @param itemNumber アイテム番号（ワークスペース内連番）
     * @param sequence タスクシーケンス番号（アイテム内連番）
     * @returns ExternalWorkspaceTaskDetailResponse タスクの取得に成功
     * @throws ApiError
     */
    public static getApiExternalWorkspacesItemsTasks1(
        workspaceIdOrCode: string,
        itemNumber: number,
        sequence: number,
    ): CancelablePromise<ExternalWorkspaceTaskDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/external/workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks/{sequence}',
            path: {
                'workspaceIdOrCode': workspaceIdOrCode,
                'itemNumber': itemNumber,
                'sequence': sequence,
            },
            errors: {
                401: `認証エラー`,
                404: `ワークスペース、アイテム、またはタスクが見つからない`,
            },
        });
    }
    /**
     * 指定ワークスペース・アイテム・タスク内のコメント一覧を取得する
     * 指定されたタスクに紐づく全コメントを取得します（論理削除されたコメントを除く）。
     * 認証された API キーの組織に属するワークスペース・アイテム・タスクのみアクセス可能です。
     * @param workspaceIdOrCode ワークスペースIDまたはコード
     * @param itemNumber アイテム番号（ワークスペース内連番）
     * @param sequence タスクシーケンス番号（アイテム内連番）
     * @returns ExternalTaskCommentListResponse タスクコメント一覧の取得に成功
     * @throws ApiError
     */
    public static getApiExternalWorkspacesItemsTasksComments(
        workspaceIdOrCode: string,
        itemNumber: number,
        sequence: number,
    ): CancelablePromise<ExternalTaskCommentListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/external/workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks/{sequence}/comments',
            path: {
                'workspaceIdOrCode': workspaceIdOrCode,
                'itemNumber': itemNumber,
                'sequence': sequence,
            },
            errors: {
                401: `認証エラー`,
                404: `ワークスペース、アイテム、またはタスクが見つからない`,
            },
        });
    }
}
