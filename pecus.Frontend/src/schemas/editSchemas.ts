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
  genreId: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z
      .number({ message: "ジャンルは必須です。" })
      .int("ジャンルを選択してください。")
      .positive("ジャンルを選択してください。"),
  ),
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

/**
 * ワークスペースアイテム作成スキーマ
 */
export const createWorkspaceItemSchema = z.object({
  subject: z
    .string()
    .min(1, "件名は必須です。")
    .max(200, "件名は200文字以内で入力してください。"),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // 空の場合は OK
        const date = new Date(val);
        return !Number.isNaN(date.getTime());
      },
      "有効な日付を入力してください。",
    )
    .optional(),
  priority: z
    .enum(["Low", "Medium", "High", "Critical"])
    .default("Medium"),
  isDraft: z.boolean().default(true),
});

export type CreateWorkspaceItemInput = z.infer<typeof createWorkspaceItemSchema>;

/**
 * ワークスペースアイテム更新スキーマ
 */
export const updateWorkspaceItemSchema = z.object({
  subject: z
    .string()
    .min(1, "件名は必須です。")
    .max(200, "件名は200文字以内で入力してください。"),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // 空の場合は OK
        const date = new Date(val);
        return !Number.isNaN(date.getTime());
      },
      "有効な日付を入力してください。",
    )
    .optional(),
  priority: z
    .enum(["Low", "Medium", "High", "Critical"])
    .optional(),
  isDraft: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  rowVersion: z.number().int().positive("RowVersionは必須です。"),
});

export type UpdateWorkspaceItemInput = z.infer<typeof updateWorkspaceItemSchema>;

