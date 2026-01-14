'use client';

import { getDisplayIconUrl } from '@/utils/imageUrl';

/**
 * アバター画像コンポーネントのProps
 */
export interface AvatarImageProps {
  /** 画像URL */
  src?: string | null;
  /** alt属性 */
  alt?: string;
  /** サイズ（ピクセル） */
  size?: number;
  /** クリック可能か */
  clickable?: boolean;
  /** クリック時のコールバック */
  onClick?: () => void;
  /** 画像がない場合のfallbackコンテンツ（指定しない場合はデフォルトアイコン） */
  fallback?: React.ReactNode;
  /** 内側divへの追加クラス（hover:ring-2など） */
  className?: string;
}

/**
 * FlyonUI avatar構造を使用したアバター画像コンポーネント
 * Gravatarなど円形画像でも境界線が見えない
 */
export default function AvatarImage({
  src,
  alt = 'avatar',
  size = 20,
  clickable = false,
  onClick,
  fallback,
  className,
}: AvatarImageProps) {
  const displayUrl = src ? getDisplayIconUrl(src) : null;

  // デフォルトのプレースホルダーアイコン
  const defaultFallback = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="text-base-content/40"
      style={{ width: size * 0.5, height: size * 0.5 }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

  // 画像またはfallback
  const content = displayUrl ? <img src={displayUrl} alt={alt} /> : (fallback ?? defaultFallback);

  const innerClassName =
    `rounded-full ${!displayUrl ? 'bg-base-300 flex items-center justify-center' : ''} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className ?? ''}`.trim();

  if (onClick) {
    return (
      <button
        type="button"
        className="avatar focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full"
        onClick={onClick}
        aria-label={`${alt}のプロフィールを表示`}
      >
        <div className={innerClassName} style={{ width: size, height: size }}>
          {content}
        </div>
      </button>
    );
  }

  return (
    <div className="avatar">
      <div className={innerClassName} style={{ width: size, height: size }}>
        {content}
      </div>
    </div>
  );
}
