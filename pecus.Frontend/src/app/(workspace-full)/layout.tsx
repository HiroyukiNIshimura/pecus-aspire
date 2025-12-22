import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import ChatProvider from '@/components/chat/ChatProvider';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { AppPublicSettingsResponse } from '@/connectors/api/pecus';
import { AppSettingsProvider, defaultAppSettings } from '@/providers/AppSettingsProvider';
import { SignalRProvider } from '@/providers/SignalRProvider';

interface WorkspaceFullLayoutProps {
  children: ReactNode;
}

/**
 * ワークスペース詳細専用レイアウト（フルスクリーン）
 *
 * このレイアウトは全画面でワークスペースを表示するページ用。
 * - 認証チェック（401の場合はリダイレクト）
 * - SignalRProvider によるリアルタイム通知
 * - ChatProvider によるチャット機能（PC用ドロワー）
 * - AppHeader/DashboardSidebar は適用しない（各ページが独自管理）
 *
 * 対象: /workspaces/[code]
 */
export default async function WorkspaceFullLayout({ children }: WorkspaceFullLayoutProps) {
  let userId: number | null = null;
  let appSettings: AppPublicSettingsResponse = defaultAppSettings;

  try {
    const api = createPecusApiClients();
    // ユーザー情報とアプリ設定を並列取得
    const [userResponse, settingsResponse] = await Promise.all([
      api.profile.getApiProfile(),
      api.profile.getApiProfileAppSettings(),
    ]);
    userId = userResponse.id;
    appSettings = settingsResponse;
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録（ページの描画は続行）
    const errorDetail = parseErrorResponse(error);
    console.error('WorkspaceFullLayout: Failed to verify auth or settings', errorDetail);
  }

  return (
    <SignalRProvider>
      <AppSettingsProvider settings={appSettings}>
        {children}
        {/* Chat Bottom Drawer (PC only) */}
        {userId && <ChatProvider currentUserId={userId} />}
      </AppSettingsProvider>
    </SignalRProvider>
  );
}
