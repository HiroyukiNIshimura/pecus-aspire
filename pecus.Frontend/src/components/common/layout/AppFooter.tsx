'use client';

import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';

/**
 * アプリケーション共通フッター
 *
 * すべてのダッシュボードページで使用される共通フッターコンポーネント。
 * layout.tsxで一元的に配置し、個別ページでの配置は不要。
 *
 * スマホでチャットページ表示時は非表示（フルスクリーンチャット用）
 */
export default function AppFooter() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // スマホでチャットページの場合は非表示
  const isChatPage = pathname?.startsWith('/chat') ?? false;
  const shouldHide = isChatPage && isMobile !== false;

  if (shouldHide) {
    return null;
  }

  return (
    <footer className="footer footer-center bg-base-200/60 px-6 py-4">
      <p>&copy; 2025 Pecus. All rights reserved.</p>
    </footer>
  );
}
