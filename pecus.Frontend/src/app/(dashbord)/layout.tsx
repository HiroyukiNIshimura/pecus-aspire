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
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <SignalRProvider>{children}</SignalRProvider>;
}
