/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceDetailResponse } from "./WorkspaceDetailResponse";
/**
 * ワークスペース操作レスポンス
 */
export type WorkspaceResponse = {
  /**
   * 成功フラグ
   */
  success?: boolean;
  /**
   * メッセージ
   */
  message?: string | null;
  workspace?: WorkspaceDetailResponse;
};
