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
import ConfirmModal from '@/components/common/overlays/ConfirmModal';
import DeleteConfirmModal from '@/components/common/overlays/DeleteConfirmModal';
import type { WebAuthnCredentialResponse } from '@/connectors/hey-api-axios/types.gen';
import { copyTextToClipboard } from '@/libs/utils/clipboard';
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
  const [deleteTarget, setDeleteTarget] = useState<WebAuthnCredentialResponse | null>(null);
  const [isReissueConfirmOpen, setIsReissueConfirmOpen] = useState(false);

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
      notify.error(toPasskeyRegistrationErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = (credential: WebAuthnCredentialResponse) => {
    setDeleteTarget(credential);
  };

  const confirmDelete = async () => {
    if (deleteTarget?.id == null) {
      return;
    }

    setIsBusy(true);
    try {
      const result = await deleteCredential({ credentialId: deleteTarget.id });
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

  const issueRecoveryCodesNow = async () => {
    setIsBusy(true);
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

  const handleIssueRecoveryCodes = () => {
    if (hasRecoveryCodes) {
      setIsReissueConfirmOpen(true);
      return;
    }

    void issueRecoveryCodesNow();
  };

  const handleCopyCodes = async () => {
    const text = issuedCodes.join('\n');
    if (await copyTextToClipboard(text)) {
      notify.success('リカバリーコードをコピーしました。');
      return;
    }
    notify.error('コピーできませんでした。コードを選択して手動でコピーしてください。');
  };

  /**
   * コードを画面から消す
   *
   * 表示したままにすると覗き見のリスクがあるため、保存後に明示的に消去する。
   */
  const handleDismissCodes = () => {
    setIssuedCodes([]);
    setIssuedInstruction('');
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
                    onClick={() => handleDelete(credential)}
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

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm btn-outline" onClick={handleCopyCodes}>
                  <span className="icon-[tabler--copy] size-4" aria-hidden="true" />
                  コピー
                </button>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleDismissCodes}>
                  <span className="icon-[tabler--check] size-4" aria-hidden="true" />
                  保存しました（閉じる）
                </button>
              </div>
            </>
          )}

          <div className="mt-4">
            <button type="button" className="btn btn-outline" onClick={handleIssueRecoveryCodes} disabled={isBusy}>
              <span className="icon-[tabler--key] size-5" />
              {hasRecoveryCodes ? 'リカバリーコードを再発行' : 'リカバリーコードを発行'}
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemType="パスキー"
        itemName={deleteTarget?.name ?? ''}
        additionalWarning="この端末ではログインできなくなります。"
      />

      <ConfirmModal
        isOpen={isReissueConfirmOpen}
        onClose={() => setIsReissueConfirmOpen(false)}
        onConfirm={issueRecoveryCodesNow}
        title="リカバリーコードの再発行"
        description="既存のリカバリーコードはすべて無効になります。再発行しますか？"
        confirmLabel="再発行する"
        variant="warning"
        iconClass="icon-[tabler--key]"
      />
    </div>
  );
}
