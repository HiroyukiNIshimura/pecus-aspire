import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import DashboardLayoutClient from '@/components/common/layout/DashboardLayoutClient';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { AppPublicSettingsResponse } from '@/connectors/api/pecus';
import { AppSettingsProvider, defaultAppSettings } from '@/providers/AppSettingsProvider';
import { SignalRProvider } from '@/providers/SignalRProvider';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * ダッシュボード（認証済み）レイアウト
 *
 * - SSRでユーザー情報を取得
 * - 共通の AppHeader と DashboardSidebar を配置
 * - SignalR によるリアルタイム通知を有効化
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let userInfo = null;
  let appSettings: AppPublicSettingsResponse = defaultAppSettings;

  try {
    const api = createPecusApiClients();
    // ユーザー情報とアプリ設定を並列取得
    const [userResponse, settingsResponse] = await Promise.all([
      api.profile.getApiProfile(),
      api.profile.getApiProfileAppSettings(),
    ]);
    userInfo = mapUserResponseToUserInfo(userResponse);
    appSettings = settingsResponse;
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録
    const errorDetail = parseErrorResponse(error);
    console.error('DashboardLayout: Failed to fetch user or settings', errorDetail);
  }

  return (
    <SignalRProvider>
      <AppSettingsProvider settings={appSettings}>
        <DashboardLayoutClient userInfo={userInfo}>{children}</DashboardLayoutClient>
      </AppSettingsProvider>
    </SignalRProvider>
  );
}
