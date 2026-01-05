'use client';

import { usePathname } from 'next/navigation';

interface BackOfficeSidebarProps {
  sidebarOpen: boolean;
}

const menuItems = [
  { href: '/backoffice', label: 'ダッシュボード', iconClass: 'icon-[mdi--view-dashboard-outline]' },
  { href: '/backoffice/organizations', label: '組織管理', iconClass: 'icon-[mdi--office-building-outline]' },
  { href: '/backoffice/notifications', label: 'システム通知', iconClass: 'icon-[mdi--bell-outline]' },
  { href: '/backoffice/monitoring', label: 'システム状況', iconClass: 'icon-[mdi--chart-line]' },
];

export default function BackOfficeSidebar({ sidebarOpen }: BackOfficeSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/backoffice') {
      return pathname === '/backoffice';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`bg-base-200 p-4 transition-all duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:block fixed md:sticky md:top-0 md:h-[calc(100vh-4rem)] overflow-y-auto z-30 lg:w-64 md:w-20 w-64 h-screen`}
    >
      <h2 className="text-lg font-semibold mb-4 lg:block hidden whitespace-nowrap overflow-hidden text-ellipsis">
        BackOffice
      </h2>
      <ul className="menu bg-base-100 rounded-box w-full">
        {menuItems.map((item) => (
          <li key={item.href} className="w-full">
            <a
              href={item.href}
              className={`${isActive(item.href) ? 'menu-active' : ''} lg:flex-row flex-col lg:justify-start! lg:items-start! ${sidebarOpen ? 'justify-start! items-center!' : 'justify-center! items-center!'} w-full`}
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
