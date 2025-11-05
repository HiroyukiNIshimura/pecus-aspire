"use client";

import { useState, useRef, useCallback } from "react";
import { z } from "zod";

interface FieldError {
  [fieldName: string]: string[];
}

interface UseFormValidationOptions<T extends Record<string, unknown>> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
}

/**
 * Zod一本化版フォーム検証フック
 * - 入力時検証: Zodスキーマのフィールド検証
 * - サブミット時検証: Zodスキーマの全体検証
 * - 属性管理: data-pristine-*不要
 */
export function useFormValidation<T extends Record<string, unknown>>({
  schema,
  onSubmit,
}: UseFormValidationOptions<T>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  /**
   * フィールド単位のZod検証（入力時用）
   */
  const validateField = useCallback(
    async (fieldName: string, value: unknown) => {
      try {
        // スキーマから該当フィールドのスキーマを抽出
        const fieldSchema = (schema as any).shape?.[fieldName];
        if (!fieldSchema) return { isValid: true, errors: [] };

        const result = await fieldSchema.safeParseAsync(value);

        if (result.success) {
          // エラーをクリア
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
          });
          return { isValid: true, errors: [] };
        } else {
          const errors = result.error.issues.map((issue: z.ZodIssue) => issue.message);
          setFieldErrors((prev) => ({
            ...prev,
            [fieldName]: errors,
          }));
          return { isValid: false, errors };
        }
      } catch (error) {
        console.error(`Field validation error for ${fieldName}:`, error);
        return { isValid: true, errors: [] };
      }
    },
    [schema],
  );

  /**
   * フィールド接触時のマーク
   */
  const markFieldAsTouched = useCallback((fieldName: string) => {
    setTouchedFields((prev) => new Set([...prev, fieldName]));
  }, []);

  /**
   * フォーム全体のZod検証（サブミット時用）
   */
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitting) return;

      setIsSubmitting(true);
      try {
        // フォームデータを収集
        const formData = new FormData(formRef.current!);
        const data = Object.fromEntries(formData) as Record<string, any>;

        // チェックボックス値を正しく処理
        // FormData では未チェックのチェックボックスが含まれないため、スキーマから判定して追加
        if (schema instanceof z.ZodObject) {
          const shape = (schema as any).shape || {};
          Object.keys(shape).forEach((key) => {
            const fieldSchema = shape[key];
            // boolean 型フィールドの場合、未設定なら false を設定
            if (
              fieldSchema instanceof z.ZodBoolean ||
              (fieldSchema._def?.innerType instanceof z.ZodBoolean)
            ) {
              if (!(key in data)) {
                data[key] = false;
              } else {
                // "on" という値を true に変換
                data[key] = data[key] === "on" || data[key] === true;
              }
            }
          });
        }

        // Zodで全体を検証
        const result = await schema.safeParseAsync(data);

        if (!result.success) {
          // エラーをフィールドごとに分類
          const errors: FieldError = {};
          result.error.issues.forEach((issue: z.ZodIssue) => {
            const path = issue.path.join(".");
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
          });
          setFieldErrors(errors);
          return;
        }

        // 検証成功 → コールバック実行
        await onSubmit(result.data);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [schema, onSubmit, isSubmitting],
  );

  /**
   * エラー表示判定（エラーがあれば即座に表示）
   */
  const shouldShowError = useCallback(
    (fieldName: string) => {
      return !!fieldErrors[fieldName];
    },
    [fieldErrors],
  );

  /**
   * エラーメッセージを取得
   */
  const getFieldError = useCallback(
    (fieldName: string) => {
      return fieldErrors[fieldName]?.[0] || null;
    },
    [fieldErrors],
  );

  return {
    formRef,
    isSubmitting,
    fieldErrors,
    handleSubmit,
    validateField,
    shouldShowError,
    getFieldError,
  };
}
