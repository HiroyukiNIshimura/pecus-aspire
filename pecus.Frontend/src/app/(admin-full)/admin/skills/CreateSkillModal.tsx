'use client';

import { useEffect, useState } from 'react';
import { createSkill } from '@/actions/admin/skills';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { createSkillSchema } from '@/schemas/profileSchemas';

interface CreateSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSkillModal({ isOpen, onClose, onSuccess }: CreateSkillModalProps) {
  const notify = useNotify();
  const [serverErrors, setServerErrors] = useState<{ key: number; message: string }[]>([]);

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: createSkillSchema,
      onSubmit: async (data) => {
        setServerErrors([]);

        const result = await createSkill({
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
        });

        if (!result.success) {
          setServerErrors([{ key: 0, message: result.message }]);
          return;
        }

        notify.success('スキルを作成しました。');
        onSuccess();
        onClose();
      },
    });

  // モーダルが閉じられたらエラーとフォームをクリア
  useEffect(() => {
    if (!isOpen) {
      setServerErrors([]);
      resetForm();
    }
  }, [isOpen, resetForm]);

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* モーダルコンテナ */}
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="icon-[mdi--tag-plus-outline] w-6 h-6" aria-hidden="true" />
            新規スキル追加
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary btn-circle"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* モーダルボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* フォーム */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* スキル名 */}
            <div className="form-control">
              <label htmlFor="name" className="label">
                <span className="label-text font-semibold">
                  スキル名 <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="name"
                data-field="name"
                type="text"
                placeholder="例：TypeScript"
                className={`input input-bordered w-full ${shouldShowError('name') ? 'input-error' : ''}`}
                onBlur={(e) => validateField('name', e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
              {shouldShowError('name') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('name')}</span>
                </div>
              )}
            </div>

            {/* 説明 */}
            <div className="form-control">
              <label htmlFor="description" className="label">
                <span className="label-text font-semibold">説明</span>
              </label>
              <textarea
                id="description"
                data-field="description"
                placeholder="スキルの説明を入力してください..."
                className={`textarea textarea-bordered h-24 ${shouldShowError('description') ? 'textarea-error' : ''}`}
                onBlur={(e) => validateField('description', e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
              {shouldShowError('description') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('description')}</span>
                </div>
              )}
            </div>

            {/* サーバーエラー表示（ボタン直前） */}
            {serverErrors.length > 0 && (
              <div className="alert alert-soft alert-error">
                <span className="icon-[mdi--alert-circle-outline] w-5 h-5" aria-hidden="true" />
                <div>
                  <ul className="list-disc list-inside">
                    {serverErrors.map((error) => (
                      <li key={error.key}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ボタングループ */}
            <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    作成中...
                  </>
                ) : (
                  <>
                    <span className="icon-[mdi--tag-plus-outline] w-5 h-5" aria-hidden="true" />
                    作成
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
