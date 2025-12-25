import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { AppPublicSettingsResponse } from '@/connectors/api/pecus';
import { AppSettingsProvider, defaultAppSettings } from '@/providers/AppSettingsProvider';
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
 * - 管理者権限チェック（非管理者はダッシュボードにリダイレクト）
 * - SignalRProvider によるリアルタイム通知
 *
 * 対象: /admin/*
 */
export default async function AdminFullLayout({ children }: AdminFullLayoutProps) {
  let appSettings: AppPublicSettingsResponse = defaultAppSettings;

  try {
    const api = createPecusApiClients();
    // アプリ設定とユーザー情報を単一のAPI呼び出しで取得
    appSettings = await api.profile.getApiProfileAppSettings();

    // 管理者でない場合はダッシュボードにリダイレクト
    if (!appSettings.currentUser?.isAdmin) {
      redirect('/');
    }
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録（ページの描画は続行）
    const errorDetail = parseErrorResponse(error);
    console.error('AdminFullLayout: Failed to verify auth or settings', errorDetail);
  }

  return (
    <SignalRProvider>
      <AppSettingsProvider settings={appSettings}>{children}</AppSettingsProvider>
    </SignalRProvider>
  );
}
