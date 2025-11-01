import { z } from "zod";

/**
 * フィルター用の共通Zodスキーマ
 */

/**
 * 名前検索用スキーマ（最大100文字）
 */
export const nameFilterSchema = z
  .string()
  .max(100, "検索名は100文字以内で入力してください。")
  .optional();

/**
 * ワークスペース名検索用スキーマ
 */
export const workspaceNameFilterSchema = nameFilterSchema;

/**
 * スキル名検索用スキーマ
 */
export const skillNameFilterSchema = nameFilterSchema;

/**
 * タグ名検索用スキーマ
 */
export const tagNameFilterSchema = nameFilterSchema;
