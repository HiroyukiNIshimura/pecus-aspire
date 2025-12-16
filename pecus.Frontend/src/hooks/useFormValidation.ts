'use client';

import { useCallback, useRef, useState } from 'react';
import { z } from 'zod';

interface FieldError {
  [fieldName: string]: string[];
}

interface UseFormValidationOptions<T extends z.ZodRawShape> {
  schema: z.ZodObject<T>;
  onSubmit: (data: z.infer<z.ZodObject<T>>) => Promise<void>;
}

/**
 * スキーマが boolean 型かどうかを判定するヘルパー
 * ZodBoolean, ZodOptional<ZodBoolean>, ZodNullable<ZodBoolean>, ZodDefault<ZodBoolean> に対応
 */
function isBooleanSchema(schema: unknown): boolean {
  if (schema instanceof z.ZodBoolean) {
    return true;
  }
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable || schema instanceof z.ZodDefault) {
    // unwrap して再帰的にチェック
    const unwrapped = (schema as { unwrap: () => unknown }).unwrap();
    return isBooleanSchema(unwrapped);
  }
  return false;
}

/**
 * Zod一本化版フォーム検証フック
 * - 入力時検証: Zodスキーマのフィールド検証
 * - サブミット時検証: Zodスキーマの全体検証
 * - 属性管理: data-pristine-*不要
 * - Zod v4 では refine() も ZodObject を返すためそのまま使用可能
 */
export function useFormValidation<T extends z.ZodRawShape>({ schema, onSubmit }: UseFormValidationOptions<T>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [_touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  /**
   * フィールド単位のZod検証（入力時用）
   */
  const validateField = useCallback(
    async (fieldName: string, value: unknown) => {
      try {
        // スキーマから該当フィールドのスキーマを抽出
        if (!(fieldName in schema.shape)) {
          return { isValid: true, errors: [] };
        }
        const fieldSchema = schema.shape[fieldName as keyof T];
        if (!fieldSchema || typeof fieldSchema !== 'object' || !('safeParseAsync' in fieldSchema)) {
          return { isValid: true, errors: [] };
        }

        // safeParseAsync メソッドを持つオブジェクトとして呼び出し
        const parseAsync = fieldSchema.safeParseAsync as (value: unknown) => Promise<{
          success: boolean;
          data?: unknown;
          error?: { issues: Array<{ message: string }> };
        }>;
        const result = await parseAsync(value);

        if (result.success) {
          // エラーをクリア
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
          });
          return { isValid: true, errors: [] };
        } else {
          const errors = result.error?.issues.map((issue) => issue.message) ?? [];
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
  const _markFieldAsTouched = useCallback((fieldName: string) => {
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
        const data = Object.fromEntries(formData) as Record<string, unknown>;

        // チェックボックス値を正しく処理
        // FormData では未チェックのチェックボックスが含まれないため、スキーマから判定して追加
        const shape = schema.shape;
        for (const key of Object.keys(shape)) {
          const fieldSchema = shape[key as keyof T];
          // boolean 型フィールドかどうかを判定
          if (isBooleanSchema(fieldSchema)) {
            if (!(key in data)) {
              data[key] = false;
            } else {
              // "on" という値を true に変換
              data[key] = data[key] === 'on' || data[key] === true;
            }
          }
        }

        // Zodで全体を検証
        const result = await schema.safeParseAsync(data);

        if (!result.success) {
          // エラーをフィールドごとに分類
          const errors: FieldError = {};
          result.error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
          });
          setFieldErrors(errors);
          return;
        }

        // 検証成功 → コールバック実行
        await onSubmit(result.data);
      } catch (error) {
        console.error('Form submission error:', error);
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

  /**
   * フォームとバリデーションエラーをリセット
   */
  const resetForm = useCallback(() => {
    setFieldErrors({});
    setTouchedFields(new Set());
    if (formRef.current) {
      formRef.current.reset();
    }
  }, []);

  return {
    formRef,
    isSubmitting,
    fieldErrors,
    handleSubmit,
    validateField,
    shouldShowError,
    getFieldError,
    resetForm,
  };
}
