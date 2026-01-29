'use client';

interface AiProgressOverlayProps {
  /** 表示するかどうか */
  isVisible: boolean;
  /** ローディングメッセージ */
  message: string;
  /** キャンセルボタンのコールバック（省略時はキャンセルボタン非表示） */
  onCancel?: () => void;
  /** z-indexの値（デフォルト: 50） */
  zIndex?: 10 | 50;
}

/**
 * AI生成処理中のキャンセル可能なプログレスオーバーレイ
 *
 * 使用例:
 * ```tsx
 * <div className="relative">
 *   <AiProgressOverlay
 *     isVisible={isLoading}
 *     message="AIが本文を生成中..."
 *     onCancel={handleCancel}
 *   />
 *   <YourContent />
 * </div>
 * ```
 */
export default function AiProgressOverlay({ isVisible, message, onCancel, zIndex = 50 }: AiProgressOverlayProps) {
  if (!isVisible) return null;

  // Tailwindの動的クラス生成は不可のため、条件分岐で静的クラスを使用
  const zIndexClass = zIndex === 10 ? 'z-10' : 'z-50';

  return (
    <div
      className={`absolute inset-0 ${zIndexClass} flex flex-col items-center justify-center bg-base-100/80 backdrop-blur-sm rounded-box`}
    >
      <span className="loading loading-ring loading-lg text-secondary" aria-hidden="true" />
      <span className="mt-2 text-sm text-base-content/70">{message}</span>
      {onCancel && (
        <button type="button" onClick={onCancel} className="mt-3 btn btn-sm btn-secondary gap-1">
          キャンセル
          <kbd className="kbd kbd-xs">Esc</kbd>
        </button>
      )}
    </div>
  );
}
