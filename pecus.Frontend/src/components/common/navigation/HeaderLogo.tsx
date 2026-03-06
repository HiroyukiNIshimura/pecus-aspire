'use client';

import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';

/**
 * テーマに応じたロゴを表示 (Client Component)
 * resolvedTheme に依存するため Client Component
 * Next.js の Link を使用してクライアントサイドナビゲーションを実現
 */
export default function HeaderLogo() {
  const { resolvedTheme, mounted } = useTheme();

  // マウント前はプレースホルダー
  if (!mounted) {
    return (
      <Link href="/" className="hidden md:flex items-end gap-1 text-sm font-bold">
        <div className="h-16 w-32" /> {/* プレースホルダー */}
        <span className="pb-2 font-mono">DOC & TASK TRACKING</span>
      </Link>
    );
  }

  return (
    <Link href="/" className="hidden md:flex items-end gap-1 text-sm font-bold">
      <img
        src={resolvedTheme === 'dark' ? '/logo-dark.webp' : '/logo-light.webp'}
        alt="Coati Logo"
        className="h-16 w-auto"
      />
      <span className="pb-2 font-mono">DOC & TASK TRACKING</span>
    </Link>
  );
}
