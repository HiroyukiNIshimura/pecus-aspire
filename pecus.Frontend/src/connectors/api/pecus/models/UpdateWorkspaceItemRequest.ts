/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriority } from "./TaskPriority";
/**
 * ワークスペースアイテム更新リクエスト
 */
export type UpdateWorkspaceItemRequest = {
  /**
   * 件名
   */
  subject?: string | null;
  /**
   * 本文（WYSIWYGのノードデータをJSON形式で保存）
   */
  body?: string | null;
  /**
   * 作業中のユーザーID（NULL可）
   */
  assigneeId?: number | null;
  priority?: TaskPriority;
  /**
   * 期限日
   */
  dueDate?: string | null;
  /**
   * 下書き中フラグ
   */
  isDraft?: boolean | null;
  /**
   * 編集不可フラグ（アーカイブ）
   */
  isArchived?: boolean | null;
  /**
   * コミッターユーザーID（NULL可）
   */
  committerId?: number | null;
  /**
   * アイテム内容
   */
  content?: string | null;
  /**
   * アクティブフラグ
   */
  isActive?: boolean | null;
};
