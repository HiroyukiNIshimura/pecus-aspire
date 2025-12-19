'use client';

import { type ReactNode, useState } from 'react';
import ChatProvider from '@/components/chat/ChatProvider';
import AppHeader from '@/components/common/layout/AppHeader';
import DashboardSidebar from '@/components/common/layout/DashboardSidebar.server';
import type { UserInfo } from '@/types/userInfo';

interface DashboardLayoutClientProps {
  children: ReactNode;
  userInfo: UserInfo | null;
}

/**
 * ダッシュボードレイアウトのClient Component
 * サイドバーの開閉状態を管理
 */
export default function DashboardLayoutClient({ children, userInfo }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <AppHeader userInfo={userInfo} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        <DashboardSidebar sidebarOpen={sidebarOpen} isAdmin={userInfo?.isAdmin ?? false} />

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

      {/* Chat Bottom Drawer (PC only) */}
      {userInfo?.id && <ChatProvider currentUserId={userInfo.id} />}
    </div>
  );
}
