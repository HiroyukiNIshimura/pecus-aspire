import { z } from "zod";

/**
 * ワークスペース編集スキーマ
 */
export const editWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "ワークスペース名は必須です。")
    .max(100, "ワークスペース名は100文字以内で入力してください。"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください。")
    .optional()
    .default(""),
  genreId: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export type EditWorkspaceInput = z.infer<typeof editWorkspaceSchema>;

/**
 * スキル編集スキーマ
 */
export const editSkillSchema = z.object({
  name: z
    .string()
    .min(1, "スキル名は必須です。")
    .max(100, "スキル名は100文字以内で入力してください。"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください。")
    .optional()
    .default(""),
  isActive: z.boolean().default(true),
});

export type EditSkillInput = z.infer<typeof editSkillSchema>;

/**
 * タグ編集スキーマ
 */
export const editTagSchema = z.object({
  name: z
    .string()
    .min(1, "タグ名は必須です。")
    .max(100, "タグ名は100文字以内で入力してください。"),
  isActive: z.boolean().default(true),
});

export type EditTagInput = z.infer<typeof editTagSchema>;

/**
 * 組織編集スキーマ
 */
export const editOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "組織名は必須です。")
    .max(100, "組織名は100文字以内で入力してください。"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください。")
    .optional()
    .default(""),
  representativeName: z
    .string()
    .max(100, "代表者名は100文字以内で入力してください。")
    .optional()
    .default(""),
  phoneNumber: z
    .string()
    .max(20, "電話番号は20文字以内で入力してください。")
    .optional()
    .default(""),
  email: z
    .email("有効なメールアドレスを入力してください。")
    .max(255, "メールアドレスは255文字以内で入力してください。")
    .optional()
    .default(""),
});

export type EditOrganizationInput = z.infer<typeof editOrganizationSchema>;
