'use client';

import { useEffect, useState } from 'react';

/** 編集範囲の選択肢 */
export type EditScope = 'this-only' | 'this-and-future' | 'all';

interface EditScopeModalProps {
  /** モーダル表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 選択完了後のコールバック */
  onSelect: (scope: EditScope) => void;
  /** アジェンダタイトル */
  agendaTitle: string;
  /** 対象回の日付表示（例: "1/26"）- 未指定の場合は「この回のみ」「この回以降」が無効 */
  occurrenceDate?: string;
  /** シリーズの最初の回かどうか - trueの場合「この回以降」は選択不可 */
  isFirstOccurrence?: boolean;
  /** 処理中かどうか（外部からの制御用） */
  isPending?: boolean;
}

/**
 * 編集範囲選択モーダル
 * 繰り返しアジェンダ編集時に「この回のみ / この回以降 / シリーズ全体」を選択
 *
 * 設計書 2.4節に準拠:
 * - この回のみ (1/26)
 * - この回以降すべて (1/26〜) ※ 新しい繰り返しシリーズが作成されます
 * - すべての予定
 */
export function EditScopeModal({
  isOpen,
  onClose,
  onSelect,
  agendaTitle,
  occurrenceDate,
  isFirstOccurrence = false,
  isPending = false,
}: EditScopeModalProps) {
  const [selectedScope, setSelectedScope] = useState<EditScope>('all');

  // 特定回が指定されているかどうか（指定されていない場合は「この回のみ」「この回以降」は選択不可）
  const hasOccurrenceDate = !!occurrenceDate;

  // 「この回以降」が選択可能かどうか（特定回が指定されていて、かつ初回でない場合のみ）
  const canSelectThisAndFuture = hasOccurrenceDate && !isFirstOccurrence;

  // モーダル表示時にbodyスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // 閉じた時に状態リセット
      setSelectedScope('all');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESCキーで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  const handleContinue = () => {
    if (isPending) return;
    onSelect(selectedScope);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-md flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="icon-[tabler--edit] size-5" aria-hidden="true" />
            この予定を編集
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-square btn-secondary"
            onClick={onClose}
            disabled={isPending}
            aria-label="閉じる"
          >
            <span className="icon-[tabler--x] size-4" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* 説明文 */}
          <p className="text-base-content/70">
            「<span className="font-medium text-base-content">{agendaTitle}</span>
            」は繰り返しイベントです。
            <br />
            どの範囲を編集しますか？
          </p>

          {/* 選択肢 */}
          <div className="space-y-3" role="radiogroup" aria-label="編集範囲">
            {/* この回のみ */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                !hasOccurrenceDate
                  ? 'opacity-50 cursor-not-allowed border-base-300'
                  : selectedScope === 'this-only'
                    ? 'border-primary bg-primary/5 cursor-pointer'
                    : 'border-base-300 hover:border-base-content/30 cursor-pointer'
              }`}
            >
              <input
                type="radio"
                name="editScope"
                value="this-only"
                checked={selectedScope === 'this-only'}
                onChange={() => setSelectedScope('this-only')}
                className="radio radio-primary mt-0.5"
                disabled={isPending || !hasOccurrenceDate}
              />
              <div className="flex-1">
                <div className="font-medium">この回のみ{hasOccurrenceDate && ` (${occurrenceDate})`}</div>
                <div className="text-sm text-base-content/60 mt-1">
                  {hasOccurrenceDate ? (
                    'この回だけを変更します。他の回は影響を受けません。'
                  ) : (
                    <span className="text-warning">
                      <span className="icon-[tabler--alert-triangle] size-3.5 inline-block align-text-bottom mr-1" />
                      一覧から特定の回を選択してください
                    </span>
                  )}
                </div>
              </div>
            </label>

            {/* この回以降すべて */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                !canSelectThisAndFuture
                  ? 'opacity-50 cursor-not-allowed border-base-300'
                  : selectedScope === 'this-and-future'
                    ? 'border-primary bg-primary/5 cursor-pointer'
                    : 'border-base-300 hover:border-base-content/30 cursor-pointer'
              }`}
            >
              <input
                type="radio"
                name="editScope"
                value="this-and-future"
                checked={selectedScope === 'this-and-future'}
                onChange={() => setSelectedScope('this-and-future')}
                className="radio radio-primary mt-0.5"
                disabled={isPending || !canSelectThisAndFuture}
              />
              <div className="flex-1">
                <div className="font-medium">この回以降すべて{canSelectThisAndFuture && ` (${occurrenceDate}〜)`}</div>
                <div className="text-sm text-base-content/60 mt-1">
                  {canSelectThisAndFuture ? (
                    <>
                      <span className="icon-[tabler--info-circle] size-3.5 inline-block align-text-bottom mr-1" />
                      この回以降の繰り返しシリーズが変更されます
                    </>
                  ) : isFirstOccurrence ? (
                    <span className="text-warning">
                      <span className="icon-[tabler--alert-triangle] size-3.5 inline-block align-text-bottom mr-1" />
                      初回からの分割はできません。「すべての予定」を選択してください
                    </span>
                  ) : (
                    <span className="text-warning">
                      <span className="icon-[tabler--alert-triangle] size-3.5 inline-block align-text-bottom mr-1" />
                      一覧から特定の回を選択してください
                    </span>
                  )}
                </div>
              </div>
            </label>

            {/* すべての予定 */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedScope === 'all' ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-base-content/30'
              }`}
            >
              <input
                type="radio"
                name="editScope"
                value="all"
                checked={selectedScope === 'all'}
                onChange={() => setSelectedScope('all')}
                className="radio radio-primary mt-0.5"
                disabled={isPending}
              />
              <div className="flex-1">
                <div className="font-medium">すべての予定</div>
                <div className="text-sm text-base-content/60 mt-1">シリーズ全体の設定を変更します。</div>
              </div>
            </label>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-base-300 shrink-0">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isPending}>
            キャンセル
          </button>
          <button type="button" className="btn btn-primary" onClick={handleContinue} disabled={isPending}>
            {isPending && <span className="loading loading-spinner loading-sm" />}
            続行
          </button>
        </div>
      </div>
    </div>
  );
}
