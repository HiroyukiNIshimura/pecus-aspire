import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 767;

/**
 * モバイルサイズかどうかを判定するフック
 * 画面幅が767px以下の場合にtrueを返す（Tailwind md ブレークポイント基準）
 *
 * @returns true: モバイル, false: PC, null: 初期化中（SSR/クライアント初回）
 */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    // 初期値を設定
    setIsMobile(mediaQuery.matches);

    // ブレークポイントを超えた時のみ発火
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}
