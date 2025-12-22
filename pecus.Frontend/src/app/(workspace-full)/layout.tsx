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

    // まずユーザー情報を取得
    const userResponse = await api.profile.getApiProfile();
    userId = userResponse.id;

    // 次にアプリ設定を取得（別のtry-catchで囲んで個別にエラーハンドリング）
    try {
      const settingsResponse = await api.profile.getApiProfileAppSettings();
      appSettings = settingsResponse;
      console.log('[WorkspaceFullLayout] appSettings fetched:', JSON.stringify(appSettings));
    } catch (settingsError) {
      console.error('[WorkspaceFullLayout] Failed to fetch app settings:', settingsError);
      // 設定取得に失敗してもデフォルト値で続行
    }
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録（ページの描画は続行）
    const errorDetail = parseErrorResponse(error);
    console.error('WorkspaceFullLayout: Failed to verify auth', errorDetail);
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
