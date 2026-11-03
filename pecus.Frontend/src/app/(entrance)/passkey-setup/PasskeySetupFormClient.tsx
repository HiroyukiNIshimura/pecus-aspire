'use client';

import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSetupRegistrationOptions, registerWithSetup } from '@/actions/webauthn';
import type { WebAuthnSetupRegistrationResponse } from '@/connectors/hey-api-axios/types.gen';
import { copyTextToClipboard } from '@/libs/utils/clipboard';
import { buildRecoveryCodeClipboardText, RECOVERY_CODE_USAGE_NOTE } from '@/libs/utils/recoveryCode';

/**
 * パスキー登録時の DOMException をユーザー向けメッセージに変換する
 */
function toPasskeyRegistrationErrorMessage(error: unknown): string {
  const name = typeof error === 'object' && error !== null && 'name' in error ? (error as { name?: string }).name : '';
  switch (name) {
    case 'InvalidStateError':
      return 'この端末には既にパスキーが登録されています。別の端末または別のブラウザで登録してください。';
    case 'NotAllowedError':
      return '認証がキャンセルされたか、時間切れになりました。もう一度「パスキーを登録する」を押してください。';
    case 'NotSupportedError':
      return 'この端末・ブラウザはパスキーに対応していません。別のブラウザでお試しください。';
    case 'SecurityError':
      return 'セキュリティ制約により登録できませんでした。http://localhost:3000 でアクセスしているか確認してください。';
    default:
      return 'パスキーの登録に失敗しました。もう一度お試しください。';
  }
}

/**
 * パスキー登録フォーム (Client Component)
 */
export default function PasskeySetupFormClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? undefined;
  const recoveryToken = searchParams.get('recoveryToken') ?? undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [passkeySupported, setPasskeySupported] = useState(true);
  const [result, setResult] = useState<WebAuthnSetupRegistrationResponse | null>(null);
  const [isCodesDismissed, setIsCodesDismissed] = useState(false);
  const [copyMessage, setCopyMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
  }, []);

  const handleRegister = async () => {
    setApiError('');
    setIsSubmitting(true);

    try {
      const optionsResult = await getSetupRegistrationOptions({ token, recoveryToken });
      if (!optionsResult.success) {
        setApiError(optionsResult.message || 'パスキー登録を開始できませんでした。');
        return;
      }

      const options = optionsResult.data;
      const credential = await startRegistration({
        optionsJSON: {
          challenge: options.publicKey.challenge,
          rp: options.publicKey.rp,
          user: options.publicKey.user,
          pubKeyCredParams: options.publicKey.pubKeyCredParams as PublicKeyCredentialParameters[],
          timeout: options.publicKey.timeout,
          attestation: options.publicKey.attestation as AttestationConveyancePreference | undefined,
          authenticatorSelection: options.publicKey.authenticatorSelection
            ? {
                authenticatorAttachment: options.publicKey.authenticatorSelection.authenticatorAttachment as
                  | AuthenticatorAttachment
                  | undefined,
                residentKey: options.publicKey.authenticatorSelection.residentKey as ResidentKeyRequirement | undefined,
                userVerification: options.publicKey.authenticatorSelection.userVerification as
                  | UserVerificationRequirement
                  | undefined,
              }
            : undefined,
          // リカバリーは「認証器を失った」前提のため、既存クレデンシャルを除外しない。
          // 除外すると同じ端末で再登録しようとした際に InvalidStateError になる。
          excludeCredentials: recoveryToken
            ? undefined
            : options.publicKey.excludeCredentials?.map((item) => ({
                id: item.id,
                type: 'public-key' as const,
              })),
        },
      });

      const registerResult = await registerWithSetup({
        challengeId: options.challengeId,
        credential: {
          id: credential.id,
          rawId: credential.rawId,
          type: credential.type,
          response: {
            attestationObject: credential.response.attestationObject,
            clientDataJSON: credential.response.clientDataJSON,
            transports: credential.response.transports,
          },
        },
      });

      if (!registerResult.success) {
        setApiError(registerResult.message || 'パスキーの登録に失敗しました。');
        return;
      }

      setResult(registerResult.data);
    } catch (error) {
      console.error('パスキー登録中にエラーが発生:', error);
      setApiError(toPasskeyRegistrationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCodes = async (codes: string[]) => {
    if (await copyTextToClipboard(buildRecoveryCodeClipboardText(codes))) {
      setCopyMessage({ type: 'success', message: 'リカバリーコードをコピーしました。' });
      return;
    }

    setCopyMessage({ type: 'error', message: 'コピーできませんでした。コードを選択して手動でコピーしてください。' });
  };

  const hasInvalidLink = !token && !recoveryToken;

  if (hasInvalidLink) {
    return (
      <div className="card w-full shadow-lg bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-center w-full mb-6">パスキー登録</h2>
          <div className="alert alert-error">
            <span className="icon-[tabler--alert-circle] size-5 shrink-0" />
            <span>登録用のリンクが見つかりません。メールに記載されたリンクからアクセスしてください。</span>
          </div>
          <div className="text-center mt-4">
            <Link href="/signin" className="link link-primary">
              ログイン画面へ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const codes = result.recoveryCodes ?? [];
    const remainingCodeCount = result.unusedRecoveryCodeCount ?? 0;
    return (
      <div className="card w-full shadow-lg bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-center w-full">パスキーを登録しました</h2>

          {result.sessionsRevoked && (
            <div className="alert alert-soft alert-warning" role="status">
              セキュリティのため、他のすべての端末からログアウトしました。
            </div>
          )}

          {result.sessionsRevoked && codes.length > 0 && (
            <div className="alert alert-soft alert-info" role="status">
              新しいリカバリーコードを発行しました。
            </div>
          )}

          {codes.length === 0 && remainingCodeCount > 0 && (
            <div className="alert alert-soft alert-info" role="status">
              <span className="icon-[tabler--key] size-5 shrink-0" aria-hidden="true" />
              <span>
                使用したコード以外の残り {remainingCodeCount} 個は、引き続きそのまま使えます。
                作り直す場合は、ログイン後に「プロフィール → セキュリティ」から再発行してください。
              </span>
            </div>
          )}

          {codes.length > 0 && !isCodesDismissed && (
            <>
              <div className="alert alert-soft alert-warning" role="alert">
                <span className="icon-[tabler--alert-triangle] size-5 shrink-0" />
                <span>{result.recoveryCodeInstruction}</span>
              </div>

              <p className="text-sm text-base-content/70">{RECOVERY_CODE_USAGE_NOTE}</p>

              <ul className="grid grid-cols-2 gap-2 font-mono text-sm bg-base-200 rounded-box p-4">
                {codes.map((code) => (
                  <li key={code} className="select-all">
                    {code}
                  </li>
                ))}
              </ul>

              {copyMessage && (
                <div
                  className={`alert alert-soft ${copyMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}
                  role="status"
                >
                  <span>{copyMessage.message}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                <button type="button" className="btn btn-sm btn-outline" onClick={() => handleCopyCodes(codes)}>
                  <span className="icon-[tabler--copy] size-4" aria-hidden="true" />
                  コピー
                </button>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setIsCodesDismissed(true)}>
                  <span className="icon-[tabler--check] size-4" aria-hidden="true" />
                  保存しました（閉じる）
                </button>
              </div>
            </>
          )}

          {codes.length > 0 && isCodesDismissed && (
            <div className="alert alert-soft alert-success" role="status">
              <span className="icon-[tabler--check] size-5 shrink-0" aria-hidden="true" />
              <span>リカバリーコードを保存しました。この画面を閉じると再表示できません。</span>
            </div>
          )}

          <div className="mt-4">
            <Link
              href="/signin"
              className={`btn w-full ${codes.length > 0 && !isCodesDismissed ? 'btn-outline' : 'btn-accent'}`}
            >
              ログイン画面へ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full shadow-lg bg-base-100">
      <div className="card-body">
        <h2 className="card-title text-center w-full">パスキーを登録</h2>

        {apiError && (
          <div className="alert alert-soft alert-error" role="alert">
            <span>{apiError}</span>
          </div>
        )}

        {apiError && recoveryToken && (
          <div className="text-center">
            <Link href="/recovery" className="link link-primary text-sm">
              リカバリーコードを入力し直す
            </Link>
          </div>
        )}

        {apiError && !recoveryToken && (
          <p className="text-sm text-base-content/70">
            このリンクで登録できない場合は、リンクの有効期限切れか、組織の設定変更が考えられます。
            管理者にパスキー登録リンクの再発行をご依頼ください。
          </p>
        )}

        {!passkeySupported && (
          <div className="alert alert-soft alert-error" role="alert">
            このブラウザはパスキーに対応していません。別のブラウザでお試しください。
          </div>
        )}

        <p className="text-sm text-base-content/70">
          この端末の生体認証（指紋・顔認証）または画面ロック解除を使ってパスキーを登録します。
          複数の端末で使う場合は、端末ごとに登録してください。
        </p>

        {recoveryToken && (
          <p className="text-xs text-base-content/60">
            リカバリーからの登録手続きは 15
            分以内に完了してください。期限が切れた場合は、リカバリーコードを入力し直してください。
          </p>
        )}

        <button
          type="button"
          className="btn btn-accent w-full mt-4"
          onClick={handleRegister}
          disabled={isSubmitting || !passkeySupported}
        >
          {isSubmitting ? '登録中...' : 'パスキーを登録する'}
        </button>
      </div>
    </div>
  );
}
