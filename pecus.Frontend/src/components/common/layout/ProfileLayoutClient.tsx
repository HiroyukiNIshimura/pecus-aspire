'use client';

import { type ReactNode, useState } from 'react';
import AppHeader from '@/components/common/layout/AppHeader';
import ProfileSidebar from '@/components/common/layout/ProfileSidebar';
import type { CurrentUserInfo } from '@/connectors/api/pecus';

interface ProfileLayoutClientProps {
  children: ReactNode;
  userInfo: CurrentUserInfo | null;
}

/**
 * プロフィールレイアウトのClient Component
 * サイドバーの開閉状態を管理
 */
export default function ProfileLayoutClient({ children, userInfo }: ProfileLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <AppHeader userInfo={userInfo} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        <ProfileSidebar sidebarOpen={sidebarOpen} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSidebarOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="サイドバーを閉じる"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 bg-base-100 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
