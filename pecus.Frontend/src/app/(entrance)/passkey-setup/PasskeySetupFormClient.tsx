'use client';

import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSetupRegistrationOptions, registerWithSetup } from '@/actions/webauthn';
import type { WebAuthnSetupRegistrationResponse } from '@/connectors/hey-api-axios/types.gen';

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
  const [savedToAnotherDevice, setSavedToAnotherDevice] = useState(false);

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
          excludeCredentials: options.publicKey.excludeCredentials?.map((item) => ({
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
      setApiError('パスキーの登録がキャンセルされたか、この端末では利用できませんでした。');
    } finally {
      setIsSubmitting(false);
    }
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
    return (
      <div className="card w-full shadow-lg bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-center w-full">パスキーを登録しました</h2>

          {result.sessionsRevoked && (
            <div className="alert alert-soft alert-warning" role="status">
              セキュリティのため、他のすべての端末からログアウトしました。
            </div>
          )}

          {codes.length > 0 && (
            <>
              <div className="alert alert-soft alert-warning" role="alert">
                <span className="icon-[tabler--alert-triangle] size-5 shrink-0" />
                <span>{result.recoveryCodeInstruction}</span>
              </div>

              <ul className="grid grid-cols-2 gap-2 font-mono text-sm bg-base-200 rounded-box p-4">
                {codes.map((code) => (
                  <li key={code} className="select-all">
                    {code}
                  </li>
                ))}
              </ul>

              <label className="label cursor-pointer justify-start gap-3 mt-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={savedToAnotherDevice}
                  onChange={(event) => setSavedToAnotherDevice(event.target.checked)}
                />
                <span className="label-text">別のデバイスに保存しました（この画面を閉じると再表示できません）</span>
              </label>
            </>
          )}

          <div className="mt-4">
            <Link
              href="/signin"
              className={`btn btn-accent w-full ${codes.length > 0 && !savedToAnotherDevice ? 'btn-disabled' : ''}`}
              aria-disabled={codes.length > 0 && !savedToAnotherDevice}
              onClick={(event) => {
                if (codes.length > 0 && !savedToAnotherDevice) {
                  event.preventDefault();
                }
              }}
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
            {apiError}
          </div>
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
