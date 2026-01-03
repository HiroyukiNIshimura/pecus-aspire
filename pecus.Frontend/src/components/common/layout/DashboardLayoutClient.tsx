'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import ChatProvider from '@/components/chat/ChatProvider';
import AppHeader from '@/components/common/layout/AppHeader';
import DashboardSidebar from '@/components/common/layout/DashboardSidebar.server';
import type { CurrentUserInfo } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';

interface DashboardLayoutClientProps {
  children: ReactNode;
  userInfo: CurrentUserInfo | null;
}

/**
 * ダッシュボードレイアウトのClient Component
 * サイドバーの開閉状態を管理
 */
export default function DashboardLayoutClient({ children, userInfo }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // スマホ用チャットページでは AppHeader/Sidebar を非表示
  // /chat または /chat/rooms/* のパスで、スマホ表示の場合
  const isMobileChatPage = isMobile === true && pathname?.startsWith('/chat');

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {!isMobileChatPage && (
        <AppHeader
          userInfo={userInfo}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showBackOfficeLink={userInfo?.isBackOffice ?? false}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        {!isMobileChatPage && <DashboardSidebar sidebarOpen={sidebarOpen} isAdmin={userInfo?.isAdmin ?? false} />}

        {/* Overlay for mobile */}
        {sidebarOpen && !isMobileChatPage && (
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
        <main className={`flex-1 ${isMobileChatPage ? '' : 'p-4 md:p-6'} bg-base-100 overflow-y-auto`}>
          {children}
        </main>
      </div>

      {/* Chat Bottom Drawer (PC only) */}
      {userInfo?.id && <ChatProvider currentUserId={userInfo.id} />}
    </div>
  );
}
