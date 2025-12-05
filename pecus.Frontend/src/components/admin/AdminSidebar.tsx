'use client';

import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  sidebarOpen: boolean;
}

const menuItems = [
  { href: '/admin', label: '組織', iconClass: 'icon-[mdi--office-building-outline]' },
  { href: '/admin/workspaces', label: 'ワークスペース', iconClass: 'icon-[mdi--view-grid-outline]' },
  { href: '/admin/users', label: 'ユーザー', iconClass: 'icon-[mdi--account-group-outline]' },
  { href: '/admin/skills', label: 'スキル', iconClass: 'icon-[mdi--badge-account-outline]' },
  { href: '/admin/tags', label: 'タグ', iconClass: 'icon-[mdi--tag-outline]' },
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
        {menuItems.map((item) => (
          <li key={item.href} className="w-full">
            <a
              href={item.href}
              className={`${pathname === item.href ? 'menu-active' : ''} lg:flex-row flex-col lg:!justify-start lg:!items-start ${sidebarOpen ? '!justify-start !items-center' : '!justify-center !items-center'} w-full`}
              title={item.label}
            >
              <span className={`${item.iconClass} size-5`} aria-hidden="true" />
              <span className={`${sidebarOpen ? 'block' : 'hidden'} md:hidden lg:inline`}>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
