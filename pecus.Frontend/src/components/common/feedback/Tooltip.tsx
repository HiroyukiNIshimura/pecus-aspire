import type { ReactNode } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  /** ツールチップの内容 */
  text: string;
  /** ツールチップを表示する対象の要素 */
  children: ReactNode;
  /** ツールチップの表示位置 */
  position?: TooltipPosition;
  /** 追加のクラス名（外側コンテナ） */
  className?: string;
  /** ツールチップ内容部分の追加クラス名 */
  contentClassName?: string;
}

const positionClasses: Record<
  TooltipPosition,
  {
    container: string;
    arrow: string;
  }
> = {
  top: {
    container: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow: 'top-full left-1/2 -translate-x-1/2 border-t-neutral border-x-transparent border-b-transparent',
  },
  bottom: {
    container: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral border-x-transparent border-t-transparent',
  },
  left: {
    container: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow: 'left-full top-1/2 -translate-y-1/2 border-l-neutral border-y-transparent border-r-transparent',
  },
  right: {
    container: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow: 'right-full top-1/2 -translate-y-1/2 border-r-neutral border-y-transparent border-l-transparent',
  },
};

/**
 * CSS-only Tooltip コンポーネント
 *
 * FlyonUIのスタイルに合わせたシンプルなツールチップ。
 * JavaScriptを使用せず、CSSの:hover/:focusで表示を制御。
 * スマホ（タッチデバイス）では表示されない。
 *
 * @example
 * ```tsx
 * <Tooltip text="これはヒントです">
 *   <button>?</button>
 * </Tooltip>
 *
 * <Tooltip text="下に表示" position="bottom">
 *   <span className="icon-[tabler--info-circle]" />
 * </Tooltip>
 * ```
 */
export function Tooltip({ text, children, position = 'top', className = '', contentClassName = '' }: TooltipProps) {
  const positionClass = positionClasses[position];

  return (
    <span className={`relative inline-flex group ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`
          tooltip-content
          pointer-events-none
          absolute z-50
          px-2 py-1
          text-xs text-neutral-content
          bg-neutral rounded shadow-lg
          transition-opacity duration-200
          w-max max-w-48 text-left wrap-break-word
          ${positionClass.container}
          ${contentClassName}
        `}
      >
        {text}
        {/* 矢印 */}
        <span
          className={`
            absolute
            border-4
            ${positionClass.arrow}
          `}
        />
      </span>
    </span>
  );
}

/**
 * ヘルプアイコン付きツールチップ
 *
 * よくある「?」アイコンにツールチップを付けたパターン
 *
 * @example
 * ```tsx
 * <HelpTooltip text="この項目は必須です" />
 * ```
 */
export function HelpTooltip({ text, position = 'top', className = '' }: Omit<TooltipProps, 'children'>) {
  return (
    <Tooltip text={text} position={position} className={className}>
      <span
        className="icon-[tabler--help-circle] text-base-content/50 hover:text-base-content cursor-help text-sm"
        aria-label="ヘルプ"
      />
    </Tooltip>
  );
}
