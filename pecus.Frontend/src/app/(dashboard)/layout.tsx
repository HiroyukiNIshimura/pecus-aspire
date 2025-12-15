import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import DashboardLayoutClient from '@/components/common/DashboardLayoutClient';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
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

  try {
    const api = createPecusApiClients();
    const userResponse = await api.profile.getApiProfile();
    userInfo = mapUserResponseToUserInfo(userResponse);
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録
    const errorDetail = parseErrorResponse(error);
    console.error('DashboardLayout: Failed to fetch user', errorDetail);
  }

  return (
    <SignalRProvider>
      <DashboardLayoutClient userInfo={userInfo}>{children}</DashboardLayoutClient>
    </SignalRProvider>
  );
}
