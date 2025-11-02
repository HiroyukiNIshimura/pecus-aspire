/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ロールに権限を設定するリクエスト
 */
export type SetPermissionsToRoleRequest = {
  /**
   * 設定する権限IDのリスト。既存の権限をすべて置き換えます。
   * 空のリストまたはnullを指定するとすべての権限が削除されます。
   */
  permissionIds?: Array<number> | null;
};
