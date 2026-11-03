'use client';

import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { useAtom } from 'jotai';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { login } from '@/actions/auth';
import { getPasskeyLoginOptions, verifyPasskeyLogin } from '@/actions/webauthn';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import type { WebAuthnLoginOptionsResponse } from '@/connectors/hey-api-axios/types.gen';
import { useFormValidation } from '@/hooks/useFormValidation';
import { deviceInfoAtom } from '@/libs/atoms/deviceInfoAtom';
import { loginFormSchema } from '@/schemas/signInSchemas';
import { getDeviceInfo } from '@/utils/deviceInfo';
import { getLandingPageUrl } from '@/utils/landingPage';

type LoginMode = 'passkey' | 'password';

/**
 * ログインフォーム (Client Component)
 *
 * - ログイン識別子から利用可能な認証方式を判定する
 * - パスキー（WebAuthn）またはパスワードでログインする
 */
export default function LoginFormClient() {
  const [deviceInfo, setDeviceInfo] = useAtom(deviceInfoAtom);

  const [formData, setFormData] = useState({
    loginIdentifier: '',
    password: '',
  });

  const [mode, setMode] = useState<LoginMode>('passkey');
  const [passkeySupported, setPasskeySupported] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    };
    fetchDeviceInfo();
  }, [setDeviceInfo]);

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
  }, []);

  const redirectAfterLogin = (roles: Array<{ name?: string }> | undefined, landingPage: unknown) => {
    const isBackOfficeUser = roles?.some((role) => role.name === 'BackOffice') ?? false;
    const redirectUrl = isBackOfficeUser
      ? '/backoffice'
      : getLandingPageUrl(landingPage as Parameters<typeof getLandingPageUrl>[0]);
    window.location.href = redirectUrl;
  };

  const handlePasskeyLogin = async (loginIdentifier: string) => {
    if (!deviceInfo) {
      setApiInfo('デバイス情報の取得に失敗しました。もう一度ログインボタンを押してください。');
      return;
    }

    setIsAuthenticating(true);
    try {
      const optionsResult = await getPasskeyLoginOptions({ loginIdentifier });
      if (!optionsResult.success) {
        if (optionsResult.error === 'unauthorized' || optionsResult.error === 'not_found') {
          setApiError('パスキーでログインできませんでした。別の方法でログインするか、管理者にご連絡ください。');
        } else {
          setApiError(optionsResult.message || 'パスキー認証を開始できませんでした。');
        }
        return;
      }

      const options: WebAuthnLoginOptionsResponse = optionsResult.data;
      const assertion = await startAuthentication({
        optionsJSON: {
          challenge: options.publicKey.challenge,
          rpId: options.publicKey.rpId,
          timeout: options.publicKey.timeout,
          allowCredentials: options.publicKey.allowCredentials
            ?.filter((credential) => Boolean(credential.id))
            .map((credential) => ({
              id: credential.id,
              type: 'public-key' as const,
              // transports が無い場合はプロパティ自体を省略する（undefined を渡すと Chrome が拒否する）
              ...(credential.transports && credential.transports.length > 0
                ? { transports: credential.transports as AuthenticatorTransport[] }
                : {}),
            })),
          userVerification: options.publicKey.userVerification as UserVerificationRequirement | undefined,
        },
      });

      const result = await verifyPasskeyLogin({
        challengeId: options.challengeId,
        assertion: {
          id: assertion.id,
          rawId: assertion.rawId,
          type: assertion.type,
          response: {
            authenticatorData: assertion.response.authenticatorData,
            signature: assertion.response.signature,
            clientDataJSON: assertion.response.clientDataJSON,
            userHandle: assertion.response.userHandle,
          },
        },
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
        userAgent: deviceInfo.userAgent,
        appVersion: deviceInfo.appVersion,
        timezone: deviceInfo.timezone,
        location: deviceInfo.location ?? undefined,
      });

      if (result.success) {
        redirectAfterLogin(result.data.roles, result.data.landingPage);
        return;
      }

      setApiError(result.message || 'パスキー認証に失敗しました。');
    } catch (error) {
      console.error('パスキー認証中にエラーが発生:', error);
      setApiError('パスキー認証がキャンセルされたか、この端末では利用できません。もう一度お試しください。');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: loginFormSchema,
    onSubmit: async (data) => {
      setApiError(null);
      setApiInfo(null);

      if (!deviceInfo) {
        setApiInfo('デバイス情報の取得に失敗しました。もう一度ログインボタンを押してください。');
        return;
      }

      // 認証方式の可否はサーバー側のログイン処理で判定する。
      // (login-methods はユーザー列挙を防ぐため常に既定値を返すので事前判定には使わない)
      if (mode === 'passkey') {
        await handlePasskeyLogin(data.loginIdentifier);
        return;
      }

      if (!data.password) {
        setApiError('パスワードは必須です。');
        return;
      }

      try {
        const result = await login({
          loginIdentifier: data.loginIdentifier,
          password: data.password,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          os: deviceInfo.os,
          userAgent: deviceInfo.userAgent,
          appVersion: deviceInfo.appVersion,
          timezone: deviceInfo.timezone,
          location: deviceInfo.location ?? undefined,
        });

        if (result.success) {
          redirectAfterLogin(result.data?.roles, result.data?.landingPage);
          return;
        }

        setApiError(result.message || 'ログイン認証に失敗しました。');
      } catch (err: unknown) {
        console.error('ログイン処理中にエラーが発生:', err);
        setApiError('ログイン処理中にエラーが発生しました。');
      }
    },
  });

  const handleFieldChange = async (fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    await validateField(fieldName, value);
  };

  const isBusy = isSubmitting || isAuthenticating;

  return (
    <>
      <LoadingOverlay isLoading={isBusy} message={mode === 'passkey' ? 'パスキーで認証中...' : 'ログイン中...'} />

      <div className="card w-full max-w-md shadow-lg bg-base-100">
        <div className="card-body">
          <h1 className="card-title text-center">ログイン</h1>

          {apiError && (
            <div className="alert alert-soft alert-error" role="alert">
              {apiError}
            </div>
          )}

          {apiInfo && (
            <div className="alert alert-soft alert-info" role="status">
              {apiInfo}
            </div>
          )}

          {!passkeySupported && (
            <div className="alert alert-soft alert-warning" role="status">
              このブラウザはパスキーに対応していません。パスワードでログインするか、パスキー対応の端末をご利用ください。
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="w-full" noValidate>
            <div className="form-control w-full mb-4">
              <label htmlFor="loginIdentifier" className="label">
                <span className="label-text font-semibold">
                  ログインID <span className="text-error">*</span>
                </span>
              </label>
              <div className="w-full">
                <input
                  type="text"
                  id="loginIdentifier"
                  name="loginIdentifier"
                  placeholder="ログインIDまたはメールアドレス"
                  className={`input input-bordered w-full ${shouldShowError('loginIdentifier') ? 'input-error' : ''}`}
                  value={formData.loginIdentifier}
                  onChange={(event) => handleFieldChange('loginIdentifier', event.target.value)}
                  disabled={isBusy}
                  required
                  autoComplete="username webauthn"
                />
                {shouldShowError('loginIdentifier') && (
                  <span className="label-text-alt text-error">{getFieldError('loginIdentifier')}</span>
                )}
              </div>
            </div>

            {mode === 'password' && (
              <div className="form-control w-full mb-4">
                <label htmlFor="password" className="label">
                  <span className="label-text font-semibold">
                    パスワード <span className="text-error">*</span>
                  </span>
                </label>
                <div className="w-full">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="パスワード"
                    className={`input input-bordered w-full ${shouldShowError('password') ? 'input-error' : ''}`}
                    value={formData.password}
                    onChange={(event) => handleFieldChange('password', event.target.value)}
                    disabled={isBusy}
                    required
                    autoComplete="current-password"
                  />
                  {shouldShowError('password') && (
                    <span className="label-text-alt text-error">{getFieldError('password')}</span>
                  )}
                </div>
              </div>
            )}

            <div className="w-full mt-6">
              <button className="btn btn-accent w-full" type="submit" disabled={isBusy}>
                {mode === 'passkey' ? 'パスキーでログイン' : 'パスワードでログイン'}
              </button>
            </div>
          </form>

          <div className="divider text-xs text-base-content/60">または</div>

          <div className="w-full">
            {mode === 'passkey' ? (
              <button
                type="button"
                className="btn btn-outline w-full"
                onClick={() => {
                  setApiError(null);
                  setApiInfo(null);
                  setMode('password');
                }}
                disabled={isBusy}
              >
                パスワードでログイン
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline w-full"
                onClick={() => {
                  setApiError(null);
                  setApiInfo(null);
                  setMode('passkey');
                }}
                disabled={isBusy || !passkeySupported}
              >
                パスキーでログイン
              </button>
            )}
          </div>

          <div className="text-center mt-4 space-y-2">
            <div>
              <Link href="/recovery" className="link link-primary">
                パスキーを紛失した場合
              </Link>
            </div>
            {mode === 'password' && (
              <div>
                <Link href="/forgot-password" className="link link-primary">
                  パスワードを忘れた
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
