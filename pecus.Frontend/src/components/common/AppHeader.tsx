'use client';

import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import { useTheme } from '@/hooks/useTheme';
import type { UserInfo } from '@/types/userInfo';
import { getDisplayIconUrl } from '@/utils/imageUrl';

interface AppHeaderProps {
  userInfo: UserInfo | null;
  onToggleSidebar?: () => void;
  loading?: boolean;
  showAdminLink?: boolean;
  hideProfileMenu?: boolean;
  hideSettingsMenu?: boolean;
  onLogout?: () => void;
}

export default function AppHeader({
  userInfo,
  onToggleSidebar,
  loading = false,
  showAdminLink = true,
  hideProfileMenu = false,
  hideSettingsMenu = false,
  onLogout,
}: AppHeaderProps) {
  const { theme, changeTheme, mounted, resolvedTheme } = useTheme();
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
        <div className="navbar-start flex items-center gap-2">
          {/* ハンバーガーメニュー（モバイルのみ） */}
          {onToggleSidebar && (
            <div className="md:hidden">
              <button type="button" className="p-2" onClick={onToggleSidebar} title="メニューを開く">
                <span className="icon-[mdi--menu] size-5" aria-hidden="true" />
              </button>
            </div>
          )}
          {/* ロゴ（デスクトップのみ） */}
          <a href="/" className="hidden md:flex items-end gap-1 text-sm font-bold">
            <img
              src={resolvedTheme === 'dark' ? '/logo-dark.webp' : '/logo-light.webp'}
              alt="Coati Logo"
              className="h-16 w-auto"
            />
            <span className="pb-2 font-mono">TASK TRACKING</span>
          </a>
        </div>

        <div className="navbar-center">
          <ul className="menu menu-horizontal px-1">
            <li className={isActive('/') ? 'bg-base-200' : ''}>
              <a href="/">
                <span className="icon-[mdi--view-dashboard] size-6" aria-hidden="true"></span>
                <span className="hidden md:inline">ダッシュボード</span>
              </a>
            </li>
            <li className={isActive('/workspaces') ? 'bg-base-200' : ''}>
              <a href="/workspaces">
                <span className="icon-[mdi--view-grid-outline] size-6" aria-hidden="true"></span>
                <span className="hidden md:inline">ワークスペース</span>
              </a>
            </li>
            {!loading && showAdminLink && userInfo?.isAdmin && (
              <li className={isActive('/admin') ? 'bg-base-200' : ''}>
                <a href="/admin">
                  <span className="icon-[mdi--cog-outline] size-6" aria-hidden="true"></span>
                  <span className="hidden md:inline">管理者</span>
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="navbar-end">
          {/* Theme Selector */}
          {mounted && (
            <div className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-end] mr-2">
              <button type="button" className="dropdown-toggle bg-transparent hover:bg-transparent before:hidden p-2">
                {theme === 'light' && <span className="icon-[mdi--white-balance-sunny] size-6" aria-hidden="true" />}
                {theme === 'dark' && <span className="icon-[mdi--moon-and-stars] size-6" aria-hidden="true" />}
                {theme === 'auto' && <span className="icon-[mdi--brightness-auto] size-6" aria-hidden="true" />}
              </button>
              <ul className="dropdown-menu dropdown-open:opacity-100 hidden min-w-32">
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <span className="icon-[mdi--white-balance-sunny] size-4" aria-hidden="true" />
                    ライト
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <span className="icon-[mdi--moon-and-stars] size-4" aria-hidden="true" />
                    ダーク
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === 'auto' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('auto')}
                  >
                    <span className="icon-[mdi--brightness-auto] size-4" aria-hidden="true" />
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
                    <span className="icon-[mdi--account] size-5" aria-hidden="true" />
                    プロフィール
                  </a>
                </li>
              )}
              {!hideSettingsMenu && (
                <li>
                  <a className="dropdown-item" href="/profile/settings">
                    <span className="icon-[mdi--cog] size-5" aria-hidden="true" />
                    設定
                  </a>
                </li>
              )}
              <li>
                <button type="button" className="dropdown-item w-full text-left" onClick={handleLogout}>
                  <span className="icon-[mdi--logout] size-5" aria-hidden="true" />
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
