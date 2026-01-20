'use client';

import { usePathname } from 'next/navigation';

interface SidebarNavItemProps {
  href: string;
  label: string;
  iconClass: string;
  sidebarOpen: boolean;
}

/**
 * サイドバーのナビゲーションアイテム
 * usePathname() でアクティブ状態を判定するため Client Component
 */
export default function SidebarNavItem({ href, label, iconClass, sidebarOpen }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li className="w-full">
      <a
        href={href}
        className={`${isActive ? 'menu-active' : ''} flex items-center justify-center md:flex-col md:items-center md:justify-center lg:flex-row lg:justify-start lg:items-center ${sidebarOpen ? 'flex-row justify-start' : 'flex-col'} w-full`}
        title={label}
      >
        <span className={`${iconClass} size-5`} aria-hidden="true" />
        <span className={`${sidebarOpen ? 'inline' : 'hidden'} md:hidden lg:inline`}>{label}</span>
      </a>
    </li>
  );
}
