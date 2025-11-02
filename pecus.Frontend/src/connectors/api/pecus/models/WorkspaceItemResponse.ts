/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceItemDetailResponse } from "./WorkspaceItemDetailResponse";
/**
 * ワークスペースアイテム操作レスポンス
 */
export type WorkspaceItemResponse = {
  /**
   * 成功フラグ
   */
  success?: boolean;
  /**
   * メッセージ
   */
  message?: string | null;
  workspaceItem?: WorkspaceItemDetailResponse;
};
