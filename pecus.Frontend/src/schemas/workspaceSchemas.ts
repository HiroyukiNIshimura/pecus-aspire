import { z } from "zod";

/**
 * ワークスペース作成スキーマ
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "ワークスペース名は必須です。")
    .max(100, "ワークスペース名は100文字以内で入力してください。"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください。")
    .optional(),
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

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

/**
 * ワークスペース更新スキーマ
 */
export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "ワークスペース名は必須です。")
    .max(100, "ワークスペース名は100文字以内で入力してください。"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください。")
    .optional(),
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

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
