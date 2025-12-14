import SidebarNavItem from './SidebarNavItem';

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  isAdmin: boolean;
}

const menuItems = [
  { href: '/', label: 'ダッシュボード', iconClass: 'icon-[mdi--view-dashboard-outline]' },
  { href: '/workspaces', label: 'マイワークスペース', iconClass: 'icon-[mdi--view-grid-outline]' },
  { href: '/my-items', label: 'マイアイテム', iconClass: 'icon-[mdi--clipboard-text-outline]' },
  { href: '/tasks', label: 'タスク', iconClass: 'icon-[mdi--clipboard-check-outline]' },
  { href: '/committer', label: 'コミッター', iconClass: 'icon-[mdi--checkbox-outline]' },
  { href: '/activity', label: 'アクティビティ', iconClass: 'icon-[mdi--history]' },
];

const adminItem = {
  href: '/admin',
  label: '管理者',
  iconClass: 'icon-[mdi--cog-outline]',
};

/**
 * ダッシュボードのサイドバー（Server Component）
 * 静的なメニュー構造をSSRでレンダリング
 * アクティブ状態の判定は SidebarNavItem (Client Component) で行う
 */
export default function DashboardSidebar({ sidebarOpen, isAdmin }: DashboardSidebarProps) {
  const allMenuItems = isAdmin ? [...menuItems, adminItem] : menuItems;

  return (
    <aside
      className={`bg-base-200 p-4 transition-all duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:block fixed md:sticky md:top-0 md:h-[calc(100vh-4rem)] overflow-y-auto z-20 lg:w-64 md:w-20 w-64 h-screen`}
    >
      <h2 className="text-lg font-semibold mb-4 lg:block hidden whitespace-nowrap overflow-hidden text-ellipsis">
        機能メニュー
      </h2>
      <ul className="menu bg-base-100 rounded-box w-full">
        {allMenuItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            iconClass={item.iconClass}
            sidebarOpen={sidebarOpen}
          />
        ))}
      </ul>
    </aside>
  );
}
