'use client';

import { usePathname } from 'next/navigation';
import ChatIconButton from '@/components/chat/ChatIconButton';
import type { CurrentUserInfo } from '@/connectors/api/pecus';
import HeaderLogo from '../navigation/HeaderLogo';
import HeaderNavItem from '../navigation/HeaderNavItem';
import MobileMenuButton from '../navigation/MobileMenuButton';
import ThemeToggle from '../navigation/ThemeToggle';
import UserMenu from '../navigation/UserMenu';

interface AppHeaderProps {
  userInfo: CurrentUserInfo | null;
  onToggleSidebar?: () => void;
  loading?: boolean;
  showAdminLink?: boolean;
  hideProfileMenu?: boolean;
  hideSettingsMenu?: boolean;
  onLogout?: () => void;
}

/**
 * アプリケーションヘッダー
 * 構造はSSR対応だが、onToggleSidebar を受け取るため Client Component
 * 各パーツは分離されたコンポーネントを使用
 */
export default function AppHeader({
  userInfo,
  onToggleSidebar,
  loading = false,
  showAdminLink = true,
  hideProfileMenu = false,
  hideSettingsMenu = false,
  onLogout,
}: AppHeaderProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 bg-base-100 shadow-sm border-b border-base-300">
      <nav className="navbar">
        <div className="navbar-start flex items-center gap-2">
          {/* ハンバーガーメニュー（モバイルのみ） */}
          {onToggleSidebar && <MobileMenuButton onToggleSidebar={onToggleSidebar} />}
          {/* ロゴ（デスクトップのみ） */}
          <HeaderLogo />
        </div>

        <div className="navbar-center">
          <ul className="menu menu-horizontal px-1">
            <HeaderNavItem href="/">
              <span className="icon-[mdi--view-dashboard] size-6" aria-hidden="true" />
              <span className="hidden md:inline">ダッシュボード</span>
            </HeaderNavItem>
            <HeaderNavItem href="/workspaces">
              <span className="icon-[mdi--view-grid-outline] size-6" aria-hidden="true" />
              <span className="hidden md:inline">ワークスペース</span>
            </HeaderNavItem>
            {!loading && showAdminLink && userInfo?.isAdmin && (
              <HeaderNavItem href="/admin">
                <span className="icon-[mdi--cog-outline] size-6" aria-hidden="true" />
                <span className="hidden md:inline">管理者</span>
              </HeaderNavItem>
            )}
            {!loading && userInfo?.isBackOffice && (
              <HeaderNavItem href="/backoffice">
                <span className="icon-[mdi--office-building] size-6" aria-hidden="true" />
                <span className="hidden md:inline">バックオフィス</span>
              </HeaderNavItem>
            )}
          </ul>
        </div>

        <div className="navbar-end flex items-center">
          <ThemeToggle />
          {!isAdminPage && <ChatIconButton />}
          <UserMenu
            userInfo={userInfo}
            hideProfileMenu={hideProfileMenu}
            hideSettingsMenu={hideSettingsMenu}
            onLogout={onLogout}
          />
        </div>
      </nav>
    </header>
  );
}
