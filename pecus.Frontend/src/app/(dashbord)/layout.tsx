'use client';

import type { ReactNode } from 'react';
import { SignalRProvider } from '@/providers/SignalRProvider';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * ダッシュボード（認証済み）レイアウト
 *
 * SignalR によるリアルタイム通知を有効化する。
 * 共通フッターはこのレイアウトで一元管理し、各ページでの個別配置は不要。
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SignalRProvider>
      <div className="flex h-full flex-col">{children}</div>
    </SignalRProvider>
  );
}
