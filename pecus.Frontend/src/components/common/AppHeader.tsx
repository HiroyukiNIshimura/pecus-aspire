'use client';

import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import { useTheme } from '@/hooks/useTheme';
import type { UserInfo } from '@/types/userInfo';
import { getDisplayIconUrl } from '@/utils/imageUrl';

interface AppHeaderProps {
  userInfo: UserInfo | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  loading?: boolean;
  showAdminLink?: boolean;
  hideProfileMenu?: boolean;
  onLogout?: () => void;
}

export default function AppHeader({
  userInfo,
  sidebarOpen,
  setSidebarOpen,
  loading = false,
  showAdminLink = true,
  hideProfileMenu = false,
  onLogout,
}: AppHeaderProps) {
  const { theme, changeTheme, mounted } = useTheme();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    changeTheme(newTheme);
    // ドロップダウンを閉じる
    setTimeout(() => {
      const themeDropdown = document.querySelector('.navbar-end > .dropdown:first-of-type') as HTMLElement;
      if (themeDropdown && window.HSDropdown) {
        const instance = window.HSDropdown.getInstance(themeDropdown, true) as {
          element?: { close: () => void };
        } | null;
        if (instance?.element) {
          instance.element.close();
        }
      }
    }, 0);
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      // Server Action を使用してログアウト
      await logout();
      window.location.href = '/signin';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-base-100 shadow-sm border-b border-base-300">
      <nav className="navbar">
        <div className="navbar-start flex flex-col">
          <a href="/" className="flex items-end gap-1 text-sm font-bold">
            <img src="/Designer2.png" alt="Coati Logo" className="h-14 w-auto" />
            <span className="pb-2">COATI TRACKING</span>
          </a>
          <div className="md:hidden mt-2">
            <button type="button" className="p-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="icon-[tabler--menu-2] size-5"></span>
            </button>
          </div>
        </div>

        <div className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal px-1">
            <li className={isActive('/') ? 'bg-base-200' : ''}>
              <a href="/">ダッシュボード</a>
            </li>
            <li className={isActive('/workspaces') ? 'bg-base-200' : ''}>
              <a href="/workspaces">ワークスペース</a>
            </li>
            {!loading && showAdminLink && userInfo?.isAdmin && (
              <li className={isActive('/admin') ? 'bg-base-200' : ''}>
                <a href="/admin">管理者</a>
              </li>
            )}
          </ul>
        </div>

        <div className="navbar-end">
          {/* Theme Selector */}
          {mounted && (
            <div className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-end] mr-2">
              <button type="button" className="dropdown-toggle bg-transparent hover:bg-transparent before:hidden p-2">
                {theme === 'light' && <span className="icon-[tabler--sun] size-5"></span>}
                {theme === 'dark' && <span className="icon-[tabler--moon] size-5"></span>}
                {theme === 'auto' && <span className="icon-[tabler--brightness-auto] size-5"></span>}
              </button>
              <ul className="dropdown-menu dropdown-open:opacity-100 hidden min-w-32">
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <span className="icon-[tabler--sun] size-4"></span>
                    ライト
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <span className="icon-[tabler--moon] size-4"></span>
                    ダーク
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === 'auto' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('auto')}
                  >
                    <span className="icon-[tabler--brightness-auto] size-4"></span>
                    自動
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* User Menu */}
          <div className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-end]">
            <button type="button" className="dropdown-toggle p-0 bg-transparent hover:bg-transparent border-none">
              <div className="avatar">
                <div className="size-10 rounded-full ring-0 hover:ring-2 hover:ring-primary transition-all">
                  {userInfo?.identityIconUrl ? (
                    <img src={getDisplayIconUrl(userInfo.identityIconUrl)} alt={userInfo.name || 'User Avatar'} />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-bold">
                      {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-open:opacity-100 hidden">
              {!hideProfileMenu && (
                <li>
                  <a className="dropdown-item" href="/profile">
                    プロフィール
                  </a>
                </li>
              )}
              <li>
                <a className="dropdown-item" href="/settings">
                  設定
                </a>
              </li>
              <li>
                <button type="button" className="dropdown-item w-full text-left" onClick={handleLogout}>
                  ログアウト
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
