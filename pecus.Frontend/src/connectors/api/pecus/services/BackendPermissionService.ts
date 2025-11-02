/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePermissionRequest } from "../models/CreatePermissionRequest";
import type { PermissionDetailResponse } from "../models/PermissionDetailResponse";
import type { PermissionListItemResponse } from "../models/PermissionListItemResponse";
import type { PermissionResponse } from "../models/PermissionResponse";
import type { SuccessResponse } from "../models/SuccessResponse";
import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
export class BackendPermissionService {
  /**
   * 権限作成
   * @param requestBody
   * @returns PermissionResponse OK
   * @throws ApiError
   */
  public static postApiBackendPermissions(
    requestBody?: CreatePermissionRequest,
  ): CancelablePromise<PermissionResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/backend/permissions",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Bad Request`,
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * 全権限取得
   * @returns PermissionListItemResponse OK
   * @throws ApiError
   */
  public static getApiBackendPermissions(): CancelablePromise<
    Array<PermissionListItemResponse>
  > {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/permissions",
      errors: {
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * 権限取得
   * @param id
   * @returns PermissionDetailResponse OK
   * @throws ApiError
   */
  public static getApiBackendPermissions1(
    id: number,
  ): CancelablePromise<PermissionDetailResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/permissions/{id}",
      path: {
        id: id,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * 権限削除
   * @param id
   * @returns SuccessResponse OK
   * @throws ApiError
   */
  public static deleteApiBackendPermissions(
    id: number,
  ): CancelablePromise<SuccessResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/backend/permissions/{id}",
      path: {
        id: id,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * カテゴリで権限取得
   * @param category
   * @returns PermissionListItemResponse OK
   * @throws ApiError
   */
  public static getApiBackendPermissionsCategory(
    category: string,
  ): CancelablePromise<Array<PermissionListItemResponse>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/permissions/category/{category}",
      path: {
        category: category,
      },
      errors: {
        500: `Internal Server Error`,
      },
    });
  }
}
