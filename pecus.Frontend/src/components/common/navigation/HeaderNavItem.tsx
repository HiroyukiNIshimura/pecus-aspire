'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface HeaderNavItemProps {
  href: string;
  children: ReactNode;
}

/**
 * ヘッダーのナビゲーションアイテム (Client Component)
 * usePathname() でアクティブ状態を判定するため Client Component
 * Next.js の Link を使用してクライアントサイドナビゲーションを実現
 */
export default function HeaderNavItem({ href, children }: HeaderNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li className={isActive ? 'bg-base-200' : ''}>
      <Link href={href}>{children}</Link>
    </li>
  );
}
