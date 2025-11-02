import { useState, useCallback } from "react";
import { z } from "zod";
import { validateWithSchema } from "@/utils/validation";

/**
 * Zodスキーマを使用したバリデーションフック（非同期対応）
 * @param schema Zodスキーマ
 * @returns バリデーション関数と状態
 */
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);

  const validate = useCallback(
    async (data: unknown) => {
      const result = await validateWithSchema(schema, data);

      if (result.success) {
        setErrors([]);
        setIsValid(true);
        return { success: true as const, data: result.data };
      } else {
        setErrors(result.errors);
        setIsValid(false);
        return { success: false as const, errors: result.errors };
      }
    },
    [schema],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
    setIsValid(true);
  }, []);

  return {
    validate,
    errors,
    isValid,
    clearErrors,
    // 便利プロパティ
    error: errors[0], // 最初のエラー
    hasErrors: errors.length > 0,
  };
}
