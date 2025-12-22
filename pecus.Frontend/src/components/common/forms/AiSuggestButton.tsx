'use client';

import { useIsAiEnabled } from '@/providers/AppSettingsProvider';

interface AiSuggestButtonProps {
  /** 提案ボタン押下時のコールバック */
  onSuggest: () => void;
  /** ボタンを無効化するかどうか */
  disabled?: boolean;
  /** 件名が入力済みかどうか（ツールチップ表示用） */
  hasSubject?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * AI提案ボタン
 *
 * 組織設定でAIプロバイダーがNone以外かつAPIキーが設定済みの場合のみ表示される。
 * AI機能が無効な組織では何も表示されない。
 *
 * @example
 * ```tsx
 * <AiSuggestButton
 *   onSuggest={handleSuggestContent}
 *   disabled={!formData.subject.trim() || isSubmitting}
 *   hasSubject={!!formData.subject.trim()}
 * />
 * ```
 */
export default function AiSuggestButton({
  onSuggest,
  disabled = false,
  hasSubject = true,
  className = '',
}: AiSuggestButtonProps) {
  const isAiEnabled = useIsAiEnabled();

  // AI機能が無効な場合は何も表示しない
  if (!isAiEnabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onSuggest}
      disabled={disabled}
      className={`btn btn-xs btn-outline btn-secondary gap-1 ${className}`}
      title={!hasSubject ? '件名を入力すると提案を利用できます' : 'AIが本文を提案します'}
    >
      <span className="icon-[mdi--auto-fix] size-4" aria-hidden="true" />
      提案を利用
    </button>
  );
}
