import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  createPecusApiClients,
  detect401ValidationError,
  getHttpErrorInfo,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import type { AppPublicSettingsResponse } from '@/connectors/api/pecus';
import { AppSettingsProvider, defaultAppSettings } from '@/providers/AppSettingsProvider';
import { SignalRProvider } from '@/providers/SignalRProvider';

interface BackOfficeFullLayoutProps {
  children: ReactNode;
}

/**
 * BackOfficeページ専用レイアウト
 *
 * BackOfficeページは独自の BackOfficeHeader + BackOfficeSidebar を持つ。
 * - 認証チェック（401の場合はリダイレクト）
 * - BackOffice権限チェック（非BackOfficeユーザーはダッシュボードにリダイレクト）
 * - SignalRProvider によるリアルタイム通知
 *
 * 対象: /backoffice/*
 */
export default async function BackOfficeFullLayout({ children }: BackOfficeFullLayoutProps) {
  let appSettings: AppPublicSettingsResponse = defaultAppSettings;

  try {
    const api = createPecusApiClients();
    appSettings = await api.profile.getApiProfileAppSettings();

    // BackOffice権限がない場合はダッシュボードにリダイレクト
    if (!appSettings.currentUser?.isBackOffice) {
      redirect('/');
    }
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録（ページの描画は続行）
    const info = getHttpErrorInfo(error);
    console.error('BackOfficeFullLayout: Failed to verify auth or settings', {
      status: info.status,
      message: getUserSafeErrorMessage(error, '認証または設定の取得に失敗しました'),
    });
  }

  return (
    <SignalRProvider>
      <AppSettingsProvider settings={appSettings}>{children}</AppSettingsProvider>
    </SignalRProvider>
  );
}
