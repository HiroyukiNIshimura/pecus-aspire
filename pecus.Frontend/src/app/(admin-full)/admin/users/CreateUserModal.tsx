'use client';

import { useEffect, useState } from 'react';
import { createUserWithoutPassword, getRoles } from '@/actions/admin/user';
import type { RoleListItemResponse } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { createUserWithoutPasswordSchema } from '@/schemas/profileSchemas';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const notify = useNotify();
  const [serverErrors, setServerErrors] = useState<{ key: number; message: string }[]>([]);
  const [roles, setRoles] = useState<RoleListItemResponse[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // ロール選択エラー
  const [roleError, setRoleError] = useState<string | null>(null);

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: createUserWithoutPasswordSchema,
      onSubmit: async (data) => {
        setServerErrors([]);

        // ロールのバリデーション
        if (selectedRoleIds.length === 0) {
          setRoleError('少なくとも1つのロールを選択してください。');
          return;
        }
        setRoleError(null);

        const result = await createUserWithoutPassword({
          username: data.displayName,
          email: data.email,
          roles: selectedRoleIds,
        });

        if (!result.success) {
          setServerErrors([{ key: 0, message: result.message }]);
          return;
        }

        notify.success('ユーザーを作成しました。招待メールが送信されます。');
        onSuccess();
        onClose();
      },
    });

  // ロールを取得（モーダルを開いた時に一度だけ）
  useEffect(() => {
    if (!isOpen || roles.length > 0) return;

    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const result = await getRoles();
        if (result.success && result.data) {
          // BackOfficeロールはバックオフィス専用のため除外
          setRoles(result.data.filter((role) => role.name !== 'BackOffice'));
        }
      } catch {
        // エラーは無視（UIでロール一覧が空の場合に対応）
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [isOpen, roles.length]);

  // モーダルが閉じられたらエラーとフォームをクリア
  useEffect(() => {
    if (!isOpen) {
      setServerErrors([]);
      setSelectedRoleIds([]);
      setRoleError(null);
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

  // ロール選択トグル
  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) => {
      const newValue = prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId];
      // ロールが選択されたらエラーをクリア
      if (newValue.length > 0) {
        setRoleError(null);
      }
      return newValue;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="icon-[mdi--account-plus-outline] w-6 h-6" aria-hidden="true" />
            新規ユーザー作成
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
            {/* ユーザー名 */}
            <div className="form-control">
              <label htmlFor="displayName" className="label">
                <span className="label-text font-semibold">
                  ユーザー名 <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="例：山田太郎"
                className={`input input-bordered w-full ${shouldShowError('displayName') ? 'input-error' : ''}`}
                onBlur={(e) => validateField('displayName', e.target.value)}
                disabled={isSubmitting}
                autoComplete="one-time-code"
              />
              {shouldShowError('displayName') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('displayName')}</span>
                </div>
              )}
            </div>

            {/* メールアドレス */}
            <div className="form-control">
              <label htmlFor="email" className="label">
                <span className="label-text font-semibold">
                  メールアドレス <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="例：user@example.com"
                className={`input input-bordered w-full ${shouldShowError('email') ? 'input-error' : ''}`}
                onBlur={(e) => validateField('email', e.target.value)}
                disabled={isSubmitting}
                autoComplete="one-time-code"
              />
              {shouldShowError('email') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('email')}</span>
                </div>
              )}
            </div>

            {/* ロール選択 */}
            <div className="form-control">
              <div className="label">
                <span className="label-text font-semibold">
                  ロール <span className="text-error">*</span>
                </span>
              </div>
              {isLoadingRoles ? (
                <div className="flex items-center gap-2 py-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span className="text-base-content/70">ロールを読み込み中...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      className={`btn btn-sm ${selectedRoleIds.includes(role.id) ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => toggleRole(role.id)}
                      disabled={isSubmitting}
                    >
                      {selectedRoleIds.includes(role.id) && (
                        <span className="icon-[mdi--check] w-4 h-4" aria-hidden="true" />
                      )}
                      {role.name}
                    </button>
                  ))}
                </div>
              )}
              {roleError && (
                <div className="label">
                  <span className="label-text-alt text-error">{roleError}</span>
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
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoadingRoles}>
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    作成中...
                  </>
                ) : (
                  <>
                    <span className="icon-[mdi--account-plus-outline] w-5 h-5" aria-hidden="true" />
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
