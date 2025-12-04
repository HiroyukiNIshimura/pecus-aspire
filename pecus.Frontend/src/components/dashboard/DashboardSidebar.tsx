'use client';

import { usePathname } from 'next/navigation';
import {
  AdminPanelSettingsIcon,
  AssignmentIcon,
  DashboardIcon,
  GridViewIcon,
  HistoryIcon,
  TaskIcon,
} from '@/components/icons';

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  isAdmin: boolean;
}

const menuItems = [
  { href: '/', label: 'ダッシュボード', icon: DashboardIcon },
  { href: '/workspaces', label: 'マイワークスペース', icon: GridViewIcon },
  { href: '/my-items', label: 'マイアイテム', icon: AssignmentIcon },
  { href: '/tasks', label: 'タスク', icon: TaskIcon },
  { href: '/activity', label: 'アクティビティ', icon: HistoryIcon },
];

const adminItem = {
  href: '/admin',
  label: '管理者',
  icon: AdminPanelSettingsIcon,
};

export default function DashboardSidebar({ sidebarOpen, isAdmin }: DashboardSidebarProps) {
  const pathname = usePathname();
  const allMenuItems = isAdmin ? [...menuItems, adminItem] : menuItems;

  return (
    <aside
      className={`bg-base-200 min-h-full p-4 transition-all duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:block fixed md:relative z-20 lg:w-64 md:w-20 w-64`}
    >
      <h2 className="text-lg font-semibold mb-4 lg:block hidden whitespace-nowrap overflow-hidden text-ellipsis">
        機能メニュー
      </h2>
      <ul className="menu bg-base-100 rounded-box w-full">
        {allMenuItems.map((item) => {
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
