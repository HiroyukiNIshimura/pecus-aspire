'use client';

import { usePathname } from 'next/navigation';
import { BadgeIcon, BusinessIcon, GridViewIcon, LocalOfferIcon, PeopleIcon } from '@/components/icons';

interface AdminSidebarProps {
  sidebarOpen: boolean;
}

const menuItems = [
  { href: '/admin', label: '組織', icon: BusinessIcon },
  { href: '/admin/workspaces', label: 'ワークスペース', icon: GridViewIcon },
  { href: '/admin/users', label: 'ユーザー', icon: PeopleIcon },
  { href: '/admin/skills', label: 'スキル', icon: BadgeIcon },
  { href: '/admin/tags', label: 'タグ', icon: LocalOfferIcon },
];

export default function AdminSidebar({ sidebarOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-base-200 min-h-full p-4 transition-all duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:block fixed md:relative z-30 lg:w-64 md:w-20 w-64`}
    >
      <h2 className="text-lg font-semibold mb-4 lg:block hidden whitespace-nowrap overflow-hidden text-ellipsis">
        管理者メニュー
      </h2>
      <ul className="menu bg-base-100 rounded-box w-full">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <li key={item.href} className="w-full">
              <a
                href={item.href}
                className={`${pathname === item.href ? 'menu-active' : ''} lg:flex-row flex-col lg:!justify-start lg:!items-start ${sidebarOpen ? '!justify-start !items-center' : '!justify-center !items-center'} w-full`}
                title={item.label}
              >
                <IconComponent className="w-5 h-5" />
                <span className={`${sidebarOpen ? 'block' : 'hidden'} md:hidden lg:inline`}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
