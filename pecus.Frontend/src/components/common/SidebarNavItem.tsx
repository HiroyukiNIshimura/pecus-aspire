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
        className={`${isActive ? 'menu-active' : ''} lg:flex-row flex-col lg:justify-start! lg:items-start! ${sidebarOpen ? 'justify-start! items-center!' : 'justify-center! items-center!'} w-full`}
        title={label}
      >
        <span className={`${iconClass} size-5`} aria-hidden="true" />
        <span className={`${sidebarOpen ? 'block' : 'hidden'} md:hidden lg:inline`}>{label}</span>
      </a>
    </li>
  );
}
