'use client';

import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import { startRegistration } from '@simplewebauthn/browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteCredential,
  getCredentialRegistrationOptions,
  getCredentials,
  getRecoveryCodeStatus,
  issueRecoveryCodes,
  registerCredential,
} from '@/actions/webauthn';
import type { WebAuthnCredentialResponse } from '@/connectors/hey-api-axios/types.gen';
import { formatDate } from '@/libs/utils/date';

interface PasskeysTabProps {
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

/**
 * パスキー管理タブ
 *
 * - 登録済みパスキーの一覧・追加・削除
 * - リカバリーコードの発行（必ず別デバイスに保存する旨を表示）
 */
export default function PasskeysTab({ notify, isLoading, setIsLoading }: PasskeysTabProps) {
  const [credentials, setCredentials] = useState<WebAuthnCredentialResponse[]>([]);
  const [hasRecoveryCodes, setHasRecoveryCodes] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [issuedCodes, setIssuedCodes] = useState<string[]>([]);
  const [issuedInstruction, setIssuedInstruction] = useState<string>('');
  const [savedToAnotherDevice, setSavedToAnotherDevice] = useState(false);

  // notify は毎レンダーで新しいオブジェクトを返すため、依存配列に入れると
  // 取得処理が無限に再実行される。最新値を ref 経由で参照する。
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listResult, statusResult] = await Promise.all([getCredentials(), getRecoveryCodeStatus()]);
      if (listResult.success) {
        setCredentials(listResult.data);
      } else {
        notifyRef.current.error(listResult.message || 'パスキー一覧の取得に失敗しました。');
      }
      if (statusResult.success) {
        setHasRecoveryCodes(statusResult.data.hasUnusedCodes ?? false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddPasskey = async () => {
    setIssuedCodes([]);
    setIsBusy(true);
    try {
      const optionsResult = await getCredentialRegistrationOptions();
      if (!optionsResult.success) {
        notify.error(optionsResult.message || 'パスキー登録を開始できませんでした。');
        return;
      }

      const options = optionsResult.data;
      const credential: RegistrationResponseJSON = await startRegistration({
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

      const registerResult = await registerCredential({
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
        name: navigator.userAgent.includes('Mobile') ? 'スマートフォンのパスキー' : 'この端末のパスキー',
      });

      if (!registerResult.success) {
        notify.error(registerResult.message || 'パスキーの登録に失敗しました。');
        return;
      }

      notify.success('パスキーを登録しました。');
      await load();
    } catch (error) {
      console.error('パスキー登録中にエラーが発生:', error);
      notify.error('パスキーの登録がキャンセルされました。');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (credentialId: number) => {
    if (!window.confirm('このパスキーを削除します。この端末ではログインできなくなります。よろしいですか？')) {
      return;
    }

    setIsBusy(true);
    try {
      const result = await deleteCredential({ credentialId });
      if (!result.success) {
        notify.error(result.message || 'パスキーの削除に失敗しました。');
        return;
      }
      notify.success('パスキーを削除しました。');
      await load();
    } finally {
      setIsBusy(false);
    }
  };

  const handleIssueRecoveryCodes = async () => {
    if (hasRecoveryCodes && !window.confirm('既存のリカバリーコードはすべて無効になります。再発行しますか？')) {
      return;
    }

    setIsBusy(true);
    setSavedToAnotherDevice(false);
    try {
      const result = await issueRecoveryCodes();
      if (!result.success) {
        notify.error(result.message || 'リカバリーコードの発行に失敗しました。');
        return;
      }
      setIssuedCodes(result.data.codes ?? []);
      setIssuedInstruction(result.data.instruction ?? '');
      setHasRecoveryCodes(true);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-lg">登録済みのパスキー</h3>
          <p className="text-sm text-base-content/70">
            端末ごとにパスキーを登録できます。同期パスキーは複数の端末で共有されます。
          </p>

          {credentials.length === 0 ? (
            <p className="text-sm text-base-content/60">まだパスキーが登録されていません。</p>
          ) : (
            <ul className="divide-y divide-base-200">
              {credentials.map((credential) => (
                <li key={credential.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{credential.name}</p>
                    <p className="text-xs text-base-content/60">
                      登録: {credential.createdAt ? formatDate(credential.createdAt) : '-'}
                      {credential.lastUsedAt ? ` / 最終使用: ${formatDate(credential.lastUsedAt)}` : ''}
                      {credential.isBackedUp ? ' / 同期パスキー' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-error"
                    onClick={() => credential.id != null && handleDelete(credential.id)}
                    disabled={isBusy || isLoading}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <button type="button" className="btn btn-accent" onClick={handleAddPasskey} disabled={isBusy || isLoading}>
              <span className="icon-[tabler--fingerprint] size-5" />
              パスキーを追加
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-lg">リカバリーコード</h3>
          <p className="text-sm text-base-content/70">
            パスキーをすべて失った場合に、リカバリーコードで復旧できます。
            {hasRecoveryCodes ? '未使用のコードがあります。' : '未発行です。必ず発行してください。'}
          </p>

          {issuedCodes.length > 0 && (
            <>
              <div className="alert alert-soft alert-warning" role="alert">
                <span className="icon-[tabler--alert-triangle] size-5 shrink-0" />
                <span>{issuedInstruction}</span>
              </div>

              <ul className="grid grid-cols-2 gap-2 font-mono text-sm bg-base-200 rounded-box p-4 my-2">
                {issuedCodes.map((code) => (
                  <li key={code} className="select-all">
                    {code}
                  </li>
                ))}
              </ul>

              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={savedToAnotherDevice}
                  onChange={(event) => setSavedToAnotherDevice(event.target.checked)}
                />
                <span className="label-text">別のデバイスに保存しました</span>
              </label>
            </>
          )}

          <div className="mt-4">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleIssueRecoveryCodes}
              disabled={isBusy || (issuedCodes.length > 0 && !savedToAnotherDevice)}
            >
              <span className="icon-[tabler--key] size-5" />
              {hasRecoveryCodes ? 'リカバリーコードを再発行' : 'リカバリーコードを発行'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
