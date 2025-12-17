import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import ProfileLayoutClient from '@/components/common/layout/ProfileLayoutClient';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import { SignalRProvider } from '@/providers/SignalRProvider';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';

interface ProfileLayoutProps {
  children: ReactNode;
}

/**
 * プロフィール（認証済み）レイアウト
 *
 * - SSRでユーザー情報を取得
 * - 共通の AppHeader とプロフィール専用サイドバーを配置
 * - SignalR によるリアルタイム通知を有効化
 */
export default async function ProfileLayout({ children }: ProfileLayoutProps) {
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
    console.error('ProfileLayout: Failed to fetch user', errorDetail);
  }

  return (
    <SignalRProvider>
      <ProfileLayoutClient userInfo={userInfo}>{children}</ProfileLayoutClient>
    </SignalRProvider>
  );
}
