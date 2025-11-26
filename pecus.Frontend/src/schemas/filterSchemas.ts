import { z } from "zod";

/**
 * フィルター用の共通Zodスキーマ
 */

/**
 * 名前検索用スキーマ（最大100文字）
 */
export const nameFilterSchema = z.string().max(100, "検索名は100文字以内で入力してください。").optional();

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

/**
 * ユーザー名検索用スキーマ
 */
export const usernameFilterSchema = nameFilterSchema;

/**
 * ワークスペース編集用スキーマ
 */
export const workspaceEditSchema = z.object({
  name: z.string().min(1, "ワークスペース名は必須です。").max(100, "ワークスペース名は100文字以内で入力してください。"),
  description: z.string().max(500, "説明は500文字以内で入力してください。").optional(),
});

/**
 * ワークスペース編集フォーム用スキーマ（型推論用）
 */
export type WorkspaceEditFormData = z.infer<typeof workspaceEditSchema>;
