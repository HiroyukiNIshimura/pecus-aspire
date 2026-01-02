import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import ProfileLayoutClient from '@/components/common/layout/ProfileLayoutClient';
import {
  createPecusApiClients,
  detect401ValidationError,
  getHttpErrorInfo,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import type { AppPublicSettingsResponse } from '@/connectors/api/pecus';
import { AppSettingsProvider, defaultAppSettings } from '@/providers/AppSettingsProvider';
import { SignalRProvider } from '@/providers/SignalRProvider';

interface ProfileLayoutProps {
  children: ReactNode;
}

/**
 * プロフィール（認証済み）レイアウト
 *
 * - SSRでアプリ設定とユーザー情報を取得（単一のAPI呼び出し）
 * - 共通の AppHeader とプロフィール専用サイドバーを配置
 * - SignalR によるリアルタイム通知を有効化
 */
export default async function ProfileLayout({ children }: ProfileLayoutProps) {
  let appSettings: AppPublicSettingsResponse = defaultAppSettings;

  try {
    const api = createPecusApiClients();
    // アプリ設定とユーザー情報を単一のAPI呼び出しで取得
    appSettings = await api.profile.getApiProfileAppSettings();
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録
    const info = getHttpErrorInfo(error);
    console.error('ProfileLayout: Failed to fetch app settings', {
      status: info.status,
      message: getUserSafeErrorMessage(error, 'アプリ設定の取得に失敗しました'),
    });
  }

  return (
    <SignalRProvider>
      <AppSettingsProvider settings={appSettings}>
        <ProfileLayoutClient>{children}</ProfileLayoutClient>
      </AppSettingsProvider>
    </SignalRProvider>
  );
}
