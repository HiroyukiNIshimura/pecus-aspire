import { z } from "zod";

/**
 * ワークスペース作成スキーマ
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "ワークスペース名は必須です。")
    .max(100, "ワークスペース名は100文字以内で入力してください。"),
  code: z
    .string()
    .max(50, "コードは50文字以内で入力してください。")
    .regex(
      /^[a-zA-Z0-9_-]*$/,
      "コードは英数字とハイフン・アンダースコアのみ使用できます。",
    )
    .optional(),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください。")
    .optional(),
  genreId: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  }, z
    .number()
    .int("ジャンルを選択してください。")
    .positive("ジャンルを選択してください。")
    .optional()),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
