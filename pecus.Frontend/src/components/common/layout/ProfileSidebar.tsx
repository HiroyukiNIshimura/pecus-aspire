import SidebarNavItem from '../navigation/SidebarNavItem';

interface ProfileSidebarProps {
  sidebarOpen: boolean;
}

const menuItems = [
  { href: '/profile', label: 'プロフィール', iconClass: 'icon-[mdi--account-outline]' },
  { href: '/profile/settings', label: '設定', iconClass: 'icon-[mdi--cog-outline]' },
  { href: '/profile/achievements', label: 'バッジコレクション', iconClass: 'icon-[mdi--trophy-outline]' },
];

/**
 * プロフィールページのサイドバー（Server Component）
 * プロフィール関連のメニュー構造をSSRでレンダリング
 * アクティブ状態の判定は SidebarNavItem (Client Component) で行う
 */
export default function ProfileSidebar({ sidebarOpen }: ProfileSidebarProps) {
  return (
    <aside
      className={`bg-base-200 p-4 transition-all duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:block fixed md:sticky md:top-0 md:h-[calc(100vh-4rem)] overflow-y-auto z-20 lg:w-64 md:w-20 w-64 h-screen`}
    >
      <h2 className="text-lg font-semibold mb-4 lg:block hidden whitespace-nowrap overflow-hidden text-ellipsis">
        マイアカウント
      </h2>
      <ul className="menu bg-base-100 rounded-box w-full">
        {menuItems.map((item) => (
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
