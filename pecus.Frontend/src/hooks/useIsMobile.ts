import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * モバイルサイズかどうかを判定するフック
 * 画面幅が768px未満の場合にtrueを返す
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // 初期値を設定
    checkIsMobile();

    // リサイズイベントを監視
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}
