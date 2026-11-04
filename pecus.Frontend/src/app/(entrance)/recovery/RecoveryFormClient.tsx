'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { verifyRecoveryCode } from '@/actions/webauthn';

/**
 * リカバリーコード入力フォーム (Client Component)
 *
 * パスキーを失ったユーザーがリカバリーコードで本人確認を行い、
 * パスキー再登録へ進む。
 */
export default function RecoveryFormClient() {
  const router = useRouter();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError('');

    if (!loginIdentifier.trim() || !code.trim()) {
      setApiError('ログインIDとリカバリーコードを入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyRecoveryCode({
        loginIdentifier: loginIdentifier.trim(),
        code: code.trim(),
      });

      if (!result.success) {
        setApiError(result.message || 'リカバリーコードが正しくないか、有効期限が切れています。');
        return;
      }

      router.push(`/passkey-setup?recoveryToken=${encodeURIComponent(result.data.recoveryToken)}`);
    } catch (error) {
      console.error('リカバリーコードの検証中にエラーが発生:', error);
      setApiError('リカバリーコードの検証に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card w-full shadow-lg bg-base-100">
      <div className="card-body">
        <h2 className="card-title text-center w-full">パスキーを紛失した場合</h2>

        {apiError && (
          <div className="alert alert-soft alert-error" role="alert">
            {apiError}
          </div>
        )}

        <p className="text-sm text-base-content/70">
          パスキー登録時に発行されたリカバリーコードを入力してください。
          コードを紛失した場合は、管理者にパスキー登録のリセットを依頼してください。
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-4" noValidate>
          <div className="form-control w-full mb-4">
            <label htmlFor="loginIdentifier" className="label">
              <span className="label-text font-semibold">
                ログインID <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              id="loginIdentifier"
              name="loginIdentifier"
              className="input input-bordered w-full"
              placeholder="ログインIDまたはメールアドレス"
              value={loginIdentifier}
              onChange={(event) => setLoginIdentifier(event.target.value)}
              disabled={isSubmitting}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-control w-full mb-4">
            <label htmlFor="code" className="label">
              <span className="label-text font-semibold">
                リカバリーコード <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              className="input input-bordered w-full font-mono"
              placeholder="XXXXX-XXXXX"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={isSubmitting}
              required
              autoComplete="one-time-code"
            />
          </div>

          <button className="btn btn-accent w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '確認中...' : 'リカバリーコードを確認'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/signin" className="link link-primary">
            ログイン画面へ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
