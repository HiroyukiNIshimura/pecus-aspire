"use client";

import { useState, useRef, useCallback } from "react";
import { z } from "zod";

interface FieldError {
  [fieldName: string]: string[];
}

interface UseFormValidationV2Options<T extends Record<string, unknown>> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
}

/**
 * Zod一本化版フォーム検証フック
 * - 入力時検証: Zodスキーマのフィールド検証
 * - サブミット時検証: Zodスキーマの全体検証
 * - 属性管理: data-pristine-*不要
 */
export function useFormValidationV2<T extends Record<string, unknown>>({
  schema,
  onSubmit,
}: UseFormValidationV2Options<T>) {
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
        const data = Object.fromEntries(formData);

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
