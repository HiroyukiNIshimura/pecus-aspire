'use client';

import { useState } from 'react';

/**
 * ConflictAlert コンポーネントのプロパティ
 *
 * 409 Conflict（楽観的ロックエラー）発生時に、保存ボタンの上に表示するインラインアラート。
 * ユーザーに「自分の変更で上書き」または「変更を破棄」の選択肢を提示します。
 *
 * @template T - 競合時に返される最新データの型
 */
export interface ConflictAlertProps<T> {
  /**
   * 競合が発生しているかどうか
   * true の場合、アラートが表示される
   */
  isConflict: boolean;

  /**
   * サーバーから返された最新データ
   * Server Action の conflictedModel から取得
   */
  latestData: T | null;

  /**
   * 競合メッセージ（省略時はデフォルトメッセージを表示）
   */
  message?: string;

  /**
   * 「上書き」ボタン押下時のコールバック
   * 最新の rowVersion を使ってフォームデータを更新し、再送信する
   *
   * @param latestRowVersion - 最新データから取得した rowVersion
   */
  onOverwrite: (latestRowVersion: number) => void;

  /**
   * 「破棄」ボタン押下時のコールバック
   * フォームを最新データでリセット、またはモーダルを閉じる
   *
   * @param latestData - 最新データ
   */
  onDiscard: (latestData: T) => void;

  /**
   * rowVersion を取得するためのキー（デフォルト: 'rowVersion'）
   */
  rowVersionKey?: keyof T;

  /**
   * 処理中かどうか（ボタンを無効化するために使用）
   */
  isProcessing?: boolean;
}

/**
 * 競合エラー表示アラートコンポーネント
 *
 * 楽観ロック（RowVersion による DB 競合）が発生した際に、
 * 保存ボタンの上に表示するインラインアラートです。
 *
 * モーダル・非モーダルどちらの編集画面でも使用できます。
 *
 * @example
 * ```tsx
 * <ConflictAlert
 *   isConflict={isConflict}
 *   latestData={conflictData}
 *   onOverwrite={(latestRowVersion) => {
 *     setFormData(prev => ({ ...prev, rowVersion: latestRowVersion }));
 *     setIsConflict(false);
 *     handleSubmit();
 *   }}
 *   onDiscard={(latestData) => {
 *     setFormData(latestData);
 *     setIsConflict(false);
 *   }}
 * />
 * <button type="submit" disabled={isConflict}>保存</button>
 * ```
 */
export function ConflictAlert<T extends Record<string, unknown>>({
  isConflict,
  latestData,
  message,
  onOverwrite,
  onDiscard,
  rowVersionKey = 'rowVersion' as keyof T,
  isProcessing = false,
}: ConflictAlertProps<T>) {
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);

  if (!isConflict || !latestData) {
    return null;
  }

  const latestRowVersion = latestData[rowVersionKey] as number;
  const processing = isProcessing || isLocalProcessing;

  const handleOverwrite = () => {
    setIsLocalProcessing(true);
    onOverwrite(latestRowVersion);
  };

  const handleDiscard = () => {
    setIsLocalProcessing(true);
    onDiscard(latestData);
  };

  return (
    <div className="alert alert-soft alert-warning mb-4" role="alert">
      <span className="icon-[mdi--alert-circle-outline] size-5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-semibold">{message || '別のユーザーが同時に変更しました。'}</p>
          <p className="text-sm mt-1">
            この内容で上書き保存するか、変更を破棄して最新データに戻すかを選択してください。
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-warning btn-sm" onClick={handleOverwrite} disabled={processing}>
            {processing ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <span className="icon-[mdi--content-save-edit] size-4" aria-hidden="true" />
            )}
            自分の変更で上書き
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleDiscard} disabled={processing}>
            <span className="icon-[mdi--undo] size-4" aria-hidden="true" />
            変更を破棄
          </button>
        </div>
      </div>
    </div>
  );
}
