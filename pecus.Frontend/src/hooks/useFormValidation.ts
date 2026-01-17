'use client';

import { useCallback, useRef, useState } from 'react';
import { z } from 'zod';

interface FieldError {
  [fieldName: string]: string[];
}

interface UseFormValidationOptions<T extends z.ZodRawShape> {
  schema: z.ZodObject<T>;
  onSubmit: (data: z.infer<z.ZodObject<T>>) => Promise<void>;
  /** バリデーションエラー時のコールバック */
  onValidationError?: (errors: FieldError) => void;
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
export function useFormValidation<T extends z.ZodRawShape>({
  schema,
  onSubmit,
  onValidationError,
}: UseFormValidationOptions<T>) {
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
   * data-field 属性を使用してフォームデータを収集（name 属性不要）
   * これにより iOS Safari のオートフィル検出を回避
   */
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitting) return;

      setIsSubmitting(true);
      try {
        // data-field 属性または name 属性を持つ要素からデータを収集
        // data-field 優先（iOS オートフィル回避用）、name はログインフォーム等の互換性維持用
        const form = formRef.current!;
        const data: Record<string, unknown> = {};

        // data-field 属性を持つ要素を取得
        const dataFieldElements = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          '[data-field]',
        );

        dataFieldElements.forEach((el) => {
          const fieldName = el.dataset.field!;
          if (el instanceof HTMLInputElement) {
            if (el.type === 'checkbox') {
              data[fieldName] = el.checked;
            } else if (el.type === 'radio') {
              if (el.checked) {
                data[fieldName] = el.value;
              }
            } else {
              data[fieldName] = el.value;
            }
          } else {
            // select, textarea
            data[fieldName] = el.value;
          }
        });

        // name 属性を持つ要素も取得（data-field がない場合のフォールバック）
        const namedElements = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          '[name]:not([data-field])',
        );

        namedElements.forEach((el) => {
          const fieldName = el.name;
          if (!fieldName || fieldName in data) return; // 既に data-field で取得済みならスキップ

          if (el instanceof HTMLInputElement) {
            if (el.type === 'checkbox') {
              data[fieldName] = el.checked;
            } else if (el.type === 'radio') {
              if (el.checked) {
                data[fieldName] = el.value;
              }
            } else {
              data[fieldName] = el.value;
            }
          } else {
            // select, textarea
            data[fieldName] = el.value;
          }
        });

        // チェックボックス値を正しく処理
        // data-field を持たない未チェックのチェックボックスや、スキーマで定義された boolean フィールドを補完
        const shape = schema.shape;
        for (const key of Object.keys(shape)) {
          const fieldSchema = shape[key as keyof T];
          // boolean 型フィールドかどうかを判定
          if (isBooleanSchema(fieldSchema)) {
            if (!(key in data)) {
              data[key] = false;
            } else if (data[key] === 'on') {
              // "on" という値を true に変換
              data[key] = true;
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
          // コールバックがあれば呼び出す
          onValidationError?.(errors);
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
    [schema, onSubmit, onValidationError, isSubmitting],
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
