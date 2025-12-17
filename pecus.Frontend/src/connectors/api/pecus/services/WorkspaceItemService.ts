/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWorkspaceItemRelationRequest } from '../models/AddWorkspaceItemRelationRequest';
import type { AddWorkspaceItemRelationResponse } from '../models/AddWorkspaceItemRelationResponse';
import type { CreateWorkspaceItemRequest } from '../models/CreateWorkspaceItemRequest';
import type { IFormFile } from '../models/IFormFile';
import type { PagedResponseOfWorkspaceItemDetailResponse } from '../models/PagedResponseOfWorkspaceItemDetailResponse';
import type { SetTagsToItemRequest } from '../models/SetTagsToItemRequest';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { TaskPriority } from '../models/TaskPriority';
import type { UpdateItemParentRequest } from '../models/UpdateItemParentRequest';
import type { UpdateWorkspaceItemAssigneeRequest } from '../models/UpdateWorkspaceItemAssigneeRequest';
import type { UpdateWorkspaceItemAttributeRequest } from '../models/UpdateWorkspaceItemAttributeRequest';
import type { UpdateWorkspaceItemRequest } from '../models/UpdateWorkspaceItemRequest';
import type { UpdateWorkspaceItemStatusRequest } from '../models/UpdateWorkspaceItemStatusRequest';
import type { WorkspaceItemAttachmentResponse } from '../models/WorkspaceItemAttachmentResponse';
import type { WorkspaceItemDetailResponse } from '../models/WorkspaceItemDetailResponse';
import type { WorkspaceItemRelationsResponse } from '../models/WorkspaceItemRelationsResponse';
import type { WorkspaceItemResponse } from '../models/WorkspaceItemResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceItemService {
    /**
     * ワークスペースアイテムに添付ファイルをアップロード
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param formData アップロードするファイル
     * @returns WorkspaceItemAttachmentResponse Created
     * @throws ApiError
     */
    public static postApiWorkspacesItemsAttachments(
        workspaceId: number,
        itemId: number,
        formData: {
            file?: IFormFile;
        },
    ): CancelablePromise<WorkspaceItemAttachmentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/attachments',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムの添付ファイル一覧を取得
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns WorkspaceItemAttachmentResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsAttachments(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<Array<WorkspaceItemAttachmentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/attachments',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 添付ファイルを削除
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param attachmentId 添付ファイルID
     * @returns void
     * @throws ApiError
     */
    public static deleteApiWorkspacesItemsAttachments(
        workspaceId: number,
        itemId: number,
        attachmentId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/attachments/{attachmentId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'attachmentId': attachmentId,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 添付ファイルをダウンロード
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param fileName ファイル名（一意なファイル名）
     * @returns any OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsAttachmentsDownload(
        workspaceId: number,
        itemId: number,
        fileName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/attachments/download/{fileName}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'fileName': fileName,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテム作成
     * @param workspaceId
     * @param requestBody
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesItems(
        workspaceId: number,
        requestBody: CreateWorkspaceItemRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items',
            path: {
                'workspaceId': workspaceId,
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
     * ワークスペースアイテム一覧取得
     * @param workspaceId
     * @param page
     * @param pageSize ページサイズ
     * @param isDraft 下書きかどうか
     * @param isArchived アーカイブ済みかどうか
     * @param assigneeId 担当者ID
     * @param ownerId オーナーID
     * @param committerId コミッターID（最後にコミットしたユーザー）
     * @param priority 優先度
     * @param pinned ピン留めされているかどうか
     * @param hasDueDate 期限が設定されているかどうか
     * @param searchQuery あいまい検索クエリ（Subject, RawBody を対象）
     * pgroonga を使用して日本語のゆらぎやタイポにも対応
     * @returns PagedResponseOfWorkspaceItemDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItems(
        workspaceId: number,
        page?: number,
        pageSize?: number,
        isDraft?: boolean,
        isArchived?: boolean,
        assigneeId?: number,
        ownerId?: number,
        committerId?: number,
        priority?: TaskPriority,
        pinned?: boolean,
        hasDueDate?: boolean,
        searchQuery?: string,
    ): CancelablePromise<PagedResponseOfWorkspaceItemDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items',
            path: {
                'workspaceId': workspaceId,
            },
            query: {
                'Page': page,
                'PageSize': pageSize,
                'IsDraft': isDraft,
                'IsArchived': isArchived,
                'AssigneeId': assigneeId,
                'OwnerId': ownerId,
                'CommitterId': committerId,
                'Priority': priority,
                'Pinned': pinned,
                'HasDueDate': hasDueDate,
                'SearchQuery': searchQuery,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテム取得
     * @param workspaceId
     * @param itemId
     * @returns WorkspaceItemDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItems1(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<WorkspaceItemDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテム更新
     * @param workspaceId
     * @param itemId
     * @param requestBody
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static patchApiWorkspacesItems(
        workspaceId: number,
        itemId: number,
        requestBody: UpdateWorkspaceItemRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/workspaces/{workspaceId}/items/{itemId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
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
     * ワークスペースアイテム削除
     * @param workspaceId
     * @param itemId
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiWorkspacesItems(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムをコードで取得
     * @param workspaceId
     * @param code
     * @returns WorkspaceItemDetailResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsCode(
        workspaceId: number,
        code: string,
    ): CancelablePromise<WorkspaceItemDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/code/{code}',
            path: {
                'workspaceId': workspaceId,
                'code': code,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムステータス更新
     * @param workspaceId
     * @param itemId
     * @param requestBody
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static patchApiWorkspacesItemsStatus(
        workspaceId: number,
        itemId: number,
        requestBody: UpdateWorkspaceItemStatusRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/status',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
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
     * ワークスペースアイテム担当者設定
     * @param workspaceId
     * @param itemId
     * @param requestBody
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static patchApiWorkspacesItemsAssignee(
        workspaceId: number,
        itemId: number,
        requestBody: UpdateWorkspaceItemAssigneeRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/assignee',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
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
     * ワークスペースアイテム属性更新
     * 属性ごとに値を個別に更新します。サポートされる属性:
     * - assignee: 担当者ID (int? / null で割り当て解除)
     * - committer: コミッターID (int? / null で割り当て解除)
     * - priority: 優先度 (TaskPriority enum / null でクリア)
     * - duedate: 期限日 (DateTime / null でクリア)
     * - archive: アーカイブ状態 (bool / 必須)
     * @param workspaceId
     * @param itemId
     * @param attr
     * @param requestBody
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static patchApiWorkspacesItems1(
        workspaceId: number,
        itemId: number,
        attr: string,
        requestBody: UpdateWorkspaceItemAttributeRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/{attr}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'attr': attr,
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
     * アイテムの Node データを JSON 形式でダウンロード
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns any OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsExportJson(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/export/json',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * アイテムの Node データを Markdown 形式でダウンロード
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns any OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsExportMarkdown(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/export/markdown',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * アイテムの Node データを HTML 形式でダウンロード
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns any OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsExportHtml(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/export/html',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムにPINを追加
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesItemsPin(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/pin',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムからPINを削除
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static deleteApiWorkspacesItemsPin(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/pin',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムに関連を追加
     * @param workspaceId
     * @param itemId
     * @param requestBody
     * @returns AddWorkspaceItemRelationResponse OK
     * @throws ApiError
     */
    public static postApiWorkspacesItemsRelations(
        workspaceId: number,
        itemId: number,
        requestBody: AddWorkspaceItemRelationRequest,
    ): CancelablePromise<AddWorkspaceItemRelationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/relations',
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
     * ワークスペースアイテムの関連一覧を取得
     * @param workspaceId
     * @param itemId
     * @returns WorkspaceItemRelationsResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesItemsRelations(
        workspaceId: number,
        itemId: number,
    ): CancelablePromise<WorkspaceItemRelationsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/relations',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムの関連を削除
     * @param workspaceId
     * @param itemId
     * @param relationId
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static deleteApiWorkspacesItemsRelations(
        workspaceId: number,
        itemId: number,
        relationId: number,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/relations/{relationId}',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
                'relationId': relationId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースアイテムのタグを一括設定
     * @param workspaceId ワークスペースID
     * @param itemId アイテムID
     * @param requestBody タグ一括設定リクエスト
     * @returns WorkspaceItemResponse OK
     * @throws ApiError
     */
    public static putApiWorkspacesItemsTags(
        workspaceId: number,
        itemId: number,
        requestBody: SetTagsToItemRequest,
    ): CancelablePromise<WorkspaceItemResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workspaces/{workspaceId}/items/{itemId}/tags',
            path: {
                'workspaceId': workspaceId,
                'itemId': itemId,
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
     * ワークスペース内の全アイテムリレーションを取得
     * @param workspaceId
     * @returns WorkspaceItemRelationsResponse OK
     * @throws ApiError
     */
    public static getApiWorkspacesRelations(
        workspaceId: number,
    ): CancelablePromise<WorkspaceItemRelationsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/workspaces/{workspaceId}/relations',
            path: {
                'workspaceId': workspaceId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * アイテムの親を変更（移動）
     * @param workspaceId
     * @param requestBody
     * @returns SuccessResponse OK
     * @throws ApiError
     */
    public static putApiWorkspacesRelationsParent(
        workspaceId: number,
        requestBody: UpdateItemParentRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/workspaces/{workspaceId}/relations/parent',
            path: {
                'workspaceId': workspaceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
}
