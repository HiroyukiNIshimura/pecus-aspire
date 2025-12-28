'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { resetPasswordAction } from '@/actions/password';
import { useFormValidation } from '@/hooks/useFormValidation';
import { resetPasswordSchema } from '@/schemas/signInSchemas';

/**
 * パスワードリセットフォーム (Client Component)
 *
 * 責務:
 * - URLからトークンを取得
 * - パスワード入力・確認入力の受付
 * - バリデーション（Zod）
 * - Server Action でパスワードリセット API を呼び出し
 */
export default function PasswordResetFormClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // トークンが無い場合のエラー状態
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenMissing(true);
    }
  }, [token]);

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: resetPasswordSchema,
    onSubmit: async (data) => {
      setApiError('');
      setSuccessMessage('');

      const result = await resetPasswordAction({
        token: token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (result.success) {
        setSuccessMessage(result.data.message);
        // フォームをリセット
        setFormData({ password: '', confirmPassword: '' });
      } else {
        setApiError(result.message);
      }
    },
  });

  // 入力時の検証とフォーム状態更新
  const handleFieldChange = async (fieldName: string, value: string) => {
    const newFormData = {
      ...formData,
      [fieldName]: value,
    };
    setFormData(newFormData);
    await validateField(fieldName, value);
  };

  // トークン無しの場合
  if (tokenMissing) {
    return (
      <div className="card w-full max-w-sm shadow-lg bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-center w-full mb-6">パスワードリセット</h2>
          <div className="alert alert-error">
            <span className="icon-[tabler--alert-circle] size-5 shrink-0" />
            <span>
              パスワードリセット用のトークンが見つかりません。メールに記載されたリンクからアクセスしてください。
            </span>
          </div>
          <div className="text-center mt-6 space-y-2">
            <div>
              <Link href="/forgot-password" className="link link-primary text-sm">
                パスワードリセットを再リクエスト
              </Link>
            </div>
            <div>
              <Link href="/signin" className="link link-primary text-sm">
                ログインページへ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 成功時の表示
  if (successMessage) {
    return (
      <div className="card w-full max-w-sm shadow-lg bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-center w-full mb-6">パスワードリセット完了</h2>
          <div className="alert alert-success">
            <span className="icon-[tabler--check] size-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <div className="text-center mt-6">
            <Link href="/signin" className="btn btn-accent w-full">
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-sm shadow-lg bg-base-100">
      <div className="card-body">
        <h2 className="card-title text-center w-full mb-6">パスワードリセット</h2>
        <p className="text-sm text-base-content/70 mb-4">
          新しいパスワードを設定してください。パスワードは8文字以上で、大文字・小文字・数字を含む必要があります。
        </p>

        {/* API エラー表示 */}
        {apiError && (
          <div className="alert alert-error mb-4">
            <span className="icon-[tabler--alert-circle] size-5 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="w-full" noValidate>
          {/* 隠しトークンフィールド */}
          <input type="hidden" name="token" value={token} />

          {/* パスワード入力 */}
          <div className="form-control w-full mb-4">
            <label htmlFor="password" className="label">
              <span className="label-text font-semibold">
                新しいパスワード<span className="text-error"> *</span>
              </span>
            </label>
            <div className="w-full">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="8文字以上（大文字・小文字・数字を含む）"
                className={`input input-bordered w-full ${shouldShowError('password') ? 'input-error' : ''}`}
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
              />
              {shouldShowError('password') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('password')}</span>
                </div>
              )}
            </div>
          </div>

          {/* パスワード確認 */}
          <div className="form-control w-full mb-4">
            <label htmlFor="confirmPassword" className="label">
              <span className="label-text font-semibold">
                パスワード（確認）<span className="text-error"> *</span>
              </span>
            </label>
            <div className="w-full">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="パスワードを再入力"
                className={`input input-bordered w-full ${shouldShowError('confirmPassword') ? 'input-error' : ''}`}
                value={formData.confirmPassword}
                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
              />
              {shouldShowError('confirmPassword') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('confirmPassword')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="w-full mt-6">
            <button className="btn btn-accent w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  リセット中...
                </>
              ) : (
                'パスワードをリセット'
              )}
            </button>
          </div>
        </form>

        {/* ナビゲーションリンク */}
        <div className="text-center mt-6 space-y-2">
          <div>
            <Link href="/signin" className="link link-primary text-sm">
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
