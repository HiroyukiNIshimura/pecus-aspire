'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import ChatProvider from '@/components/chat/ChatProvider';
import LandingPageRecommendationBanner from '@/components/common/feedback/LandingPageRecommendationBanner';
import AppHeader from '@/components/common/layout/AppHeader';
import DashboardSidebar from '@/components/common/layout/DashboardSidebar.server';
import type { CurrentUserInfo } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppSettings } from '@/providers/AppSettingsProvider';
import { getLandingPageUrl } from '@/utils/landingPage';

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
  const router = useRouter();
  const isMobile = useIsMobile();
  const settings = useAppSettings();

  // ランディングページリダイレクト処理
  // - ダッシュボード（/）へのアクセス時のみ実行
  // - 初回アクセス（新しいタブ、URL直接入力、ブックマーク等）時のみリダイレクト
  // - サイドバーからのナビゲーション時はsessionStorageにフラグがあるためスキップ
  useEffect(() => {
    // ダッシュボードページ以外では何もしない
    if (pathname !== '/') return;

    const LANDING_CHECKED_KEY = '__landing_checked';

    // 既にこのセッションでチェック済みならスキップ
    if (sessionStorage.getItem(LANDING_CHECKED_KEY)) return;

    // フラグを設定（リダイレクトするしないに関わらず）
    sessionStorage.setItem(LANDING_CHECKED_KEY, '1');

    // ランディングページがダッシュボード以外に設定されている場合はリダイレクト
    const landingPage = settings?.user?.landingPage;
    if (landingPage && landingPage !== 'Dashboard') {
      // ソフトナビゲーションで遷移（共通レイアウトは再レンダリングされない）
      router.replace(getLandingPageUrl(landingPage));
    }
  }, [pathname, settings?.user?.landingPage, router]);

  // スマホ用チャットページでは AppHeader/Sidebar を非表示
  // /chat または /chat/rooms/* のパスで、スマホ表示の場合
  // isMobile === null（初期化中）の場合は、チャットページなら AppHeader を非表示にしておく（ちらつき防止）
  const isChatPage = pathname?.startsWith('/chat') ?? false;
  const isMobileChatPage = isChatPage && isMobile !== false;

  // ランディングページおすすめ設定
  const pendingRecommendation = settings?.user?.pendingLandingPageRecommendation;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {!isMobileChatPage && (
        <AppHeader
          userInfo={userInfo}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showBackOfficeLink={userInfo?.isBackOffice ?? false}
        />
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
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
        <div
          data-main-content
          className={`flex-1 bg-base-100 ${
            isMobileChatPage ? 'flex flex-col min-h-0 overflow-hidden' : 'p-4 md:p-6 overflow-y-auto'
          }`}
        >
          {/* Landing Page Recommendation Banner */}
          {pendingRecommendation && !isMobileChatPage && (
            <LandingPageRecommendationBanner recommendedPage={pendingRecommendation} />
          )}
          {children}
        </div>
      </div>

      {/* Chat Bottom Drawer (PC only) */}
      {userInfo?.id && <ChatProvider currentUserId={userInfo.id} />}
    </div>
  );
}
