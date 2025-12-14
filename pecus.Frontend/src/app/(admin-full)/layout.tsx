import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import { SignalRProvider } from '@/providers/SignalRProvider';

interface AdminFullLayoutProps {
  children: ReactNode;
}

/**
 * 管理者ページ専用レイアウト
 *
 * 管理者ページは独自の AdminHeader + AdminSidebar を持つため、
 * 共通の DashboardLayoutClient は適用しない。
 * - 認証チェック（401の場合はリダイレクト）
 * - SignalRProvider によるリアルタイム通知
 *
 * 対象: /admin/*
 */
export default async function AdminFullLayout({ children }: AdminFullLayoutProps) {
  try {
    const api = createPecusApiClients();
    // ユーザー情報を取得して認証状態を確認
    const userResponse = await api.profile.getApiProfile();

    // 管理者でない場合はダッシュボードにリダイレクト
    if (!userResponse.isAdmin) {
      redirect('/');
    }
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録（ページの描画は続行）
    const errorDetail = parseErrorResponse(error);
    console.error('AdminFullLayout: Failed to verify auth', errorDetail);
  }

  return <SignalRProvider>{children}</SignalRProvider>;
}
