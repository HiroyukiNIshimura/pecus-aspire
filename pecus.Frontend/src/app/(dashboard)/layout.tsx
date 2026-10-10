import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import DashboardLayoutClient from '@/components/common/layout/DashboardLayoutClient';
import { ChatMentionNotification } from '@/components/notifications/ChatMentionNotification';
import { ItemGatherNotification } from '@/components/notifications/ItemGatherNotification';
import { getProfileAppSettingsWithHeyApi } from '@/connectors/HeyApiClient';
import type { AppPublicSettingsResponse } from '@/connectors/hey-api-axios/types.gen';
import {
  detect401ValidationError,
  getHttpErrorInfo,
  getUserSafeErrorMessage,
} from '@/connectors/legacy-api/PecusApiClient';
import { AchievementCelebrationProvider } from '@/providers/AchievementCelebrationProvider';
import { AppSettingsProvider, defaultAppSettings } from '@/providers/AppSettingsProvider';
import { SignalRProvider } from '@/providers/SignalRProvider';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * ダッシュボード（認証済み）レイアウト
 *
 * - SSRでアプリ設定とユーザー情報を取得（単一のAPI呼び出し）
 * - 共通の AppHeader と DashboardSidebar を配置
 * - SignalR によるリアルタイム通知を有効化
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let appSettings: AppPublicSettingsResponse = defaultAppSettings;

  try {
    // アプリ設定とユーザー情報を単一のAPI呼び出しで取得
    appSettings = await getProfileAppSettingsWithHeyApi();
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録
    const info = getHttpErrorInfo(error);
    console.error('DashboardLayout: Failed to fetch app settings', {
      status: info.status,
      message: getUserSafeErrorMessage(error, 'アプリ設定の取得に失敗しました'),
    });
  }

  return (
    <SignalRProvider>
      <AppSettingsProvider settings={appSettings}>
        <AchievementCelebrationProvider>
          <DashboardLayoutClient userInfo={appSettings.currentUser}>{children}</DashboardLayoutClient>
          <ChatMentionNotification />
          {/* Item Gather Notification */}
          <ItemGatherNotification />
        </AchievementCelebrationProvider>
      </AppSettingsProvider>
    </SignalRProvider>
  );
}
