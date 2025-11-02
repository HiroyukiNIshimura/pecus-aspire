import { z } from "zod";

/**
 * Zodスキーマを使用してバリデーションを実行し、結果を返す（非同期版）
 * refinements や transforms を含むスキーマにも対応
 * @param schema Zodスキーマ
 * @param data バリデーション対象のデータ
 * @returns バリデーション結果オブジェクト { success: boolean, errors?: string[], data?: T }
 */
export async function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Promise<
  | { success: true; data: T; errors?: undefined }
  | { success: false; errors: string[]; data?: undefined }
> {
  const result = await schema.safeParseAsync(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }
}
