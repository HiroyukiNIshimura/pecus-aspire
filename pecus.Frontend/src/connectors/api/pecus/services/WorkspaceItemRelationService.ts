/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWorkspaceItemRelationRequest } from "../models/AddWorkspaceItemRelationRequest";
import type { AddWorkspaceItemRelationResponse } from "../models/AddWorkspaceItemRelationResponse";
import type { SuccessResponse } from "../models/SuccessResponse";
import type { WorkspaceItemRelationsResponse } from "../models/WorkspaceItemRelationsResponse";
import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
export class WorkspaceItemRelationService {
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
    requestBody?: AddWorkspaceItemRelationRequest,
  ): CancelablePromise<AddWorkspaceItemRelationResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/workspaces/{workspaceId}/items/{itemId}/relations",
      path: {
        workspaceId: workspaceId,
        itemId: itemId,
      },
      body: requestBody,
      mediaType: "application/json",
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
      method: "GET",
      url: "/api/workspaces/{workspaceId}/items/{itemId}/relations",
      path: {
        workspaceId: workspaceId,
        itemId: itemId,
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
      method: "DELETE",
      url: "/api/workspaces/{workspaceId}/items/{itemId}/relations/{relationId}",
      path: {
        workspaceId: workspaceId,
        itemId: itemId,
        relationId: relationId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
}
