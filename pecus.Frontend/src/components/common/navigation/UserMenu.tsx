'use client';

import { logout } from '@/actions/auth';
import type { CurrentUserInfo } from '@/connectors/api/pecus';
import { getDisplayIconUrl } from '@/utils/imageUrl';

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
      <button type="button" className="dropdown-toggle p-0 bg-transparent hover:bg-transparent border-none">
        <div className="avatar">
          <div className="size-10 rounded-full ring-0 hover:ring-2 hover:ring-primary transition-all">
            {userInfo?.identityIconUrl ? (
              <img src={getDisplayIconUrl(userInfo.identityIconUrl)} alt={userInfo.username || 'User Avatar'} />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-bold">
                {userInfo?.username?.charAt(0).toUpperCase() || 'U'}
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
  );
}
