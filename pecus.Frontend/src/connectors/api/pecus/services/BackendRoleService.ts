/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRoleRequest } from "../models/CreateRoleRequest";
import type { RoleDetailResponse } from "../models/RoleDetailResponse";
import type { RoleListItemResponse } from "../models/RoleListItemResponse";
import type { RoleResponse } from "../models/RoleResponse";
import type { SetPermissionsToRoleRequest } from "../models/SetPermissionsToRoleRequest";
import type { SuccessResponse } from "../models/SuccessResponse";
import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
export class BackendRoleService {
  /**
   * ロール作成
   * @param requestBody
   * @returns RoleResponse OK
   * @throws ApiError
   */
  public static postApiBackendRoles(
    requestBody?: CreateRoleRequest,
  ): CancelablePromise<RoleResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/backend/roles",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Bad Request`,
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * 全ロール取得
   * @returns RoleListItemResponse OK
   * @throws ApiError
   */
  public static getApiBackendRoles(): CancelablePromise<
    Array<RoleListItemResponse>
  > {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/roles",
      errors: {
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * ロール取得
   * @param id
   * @returns RoleDetailResponse OK
   * @throws ApiError
   */
  public static getApiBackendRoles1(
    id: number,
  ): CancelablePromise<RoleDetailResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/roles/{id}",
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
   * ロール削除
   * @param id
   * @returns SuccessResponse OK
   * @throws ApiError
   */
  public static deleteApiBackendRoles(
    id: number,
  ): CancelablePromise<SuccessResponse> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/backend/roles/{id}",
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
   * ロールに権限を設定（既存の権限を置き換える）
   * @param roleId
   * @param requestBody
   * @returns RoleDetailResponse OK
   * @throws ApiError
   */
  public static putApiBackendRolesPermissions(
    roleId: number,
    requestBody?: SetPermissionsToRoleRequest,
  ): CancelablePromise<RoleDetailResponse> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/backend/roles/{roleId}/permissions",
      path: {
        roleId: roleId,
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
}
