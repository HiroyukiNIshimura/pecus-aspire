'use client';

import { logout } from '@/actions/auth';
import AvatarImage from '@/components/common/widgets/user/AvatarImage';
import type { CurrentUserInfo } from '@/connectors/api/pecus';

interface UserMenuProps {
  userInfo: CurrentUserInfo | null;
  hideProfileMenu?: boolean;
  hideSettingsMenu?: boolean;
  onLogout?: () => void;
}

/**
 * ユーザーメニュードロップダウン (Client Component)
 * ログアウト処理等のインタラクションがあるため Client Component
 */
export default function UserMenu({
  userInfo,
  hideProfileMenu = false,
  hideSettingsMenu = false,
  onLogout,
}: UserMenuProps) {
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
    <div className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-end]">
      <button type="button" className="dropdown-toggle btn btn-text btn-circle p-0">
        <AvatarImage
          src={userInfo?.identityIconUrl}
          alt={userInfo?.username || 'User Avatar'}
          size={32}
          className="ring-0 hover:ring-2 hover:ring-primary transition-all"
          fallback={
            <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-bold">
              {userInfo?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          }
        />
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
        <li className="dropdown-divider" />
        <li>
          <a className="dropdown-item" href="/help">
            <span className="icon-[mdi--help-circle-outline] size-5" aria-hidden="true" />
            ヘルプ
          </a>
        </li>
        <li className="dropdown-divider" />
        <li>
          <button type="button" className="dropdown-item w-full text-left" onClick={handleLogout}>
            <span className="icon-[mdi--logout] size-5" aria-hidden="true" />
            ログアウト
          </button>
        </li>
      </ul>
    </div>
  );
}
