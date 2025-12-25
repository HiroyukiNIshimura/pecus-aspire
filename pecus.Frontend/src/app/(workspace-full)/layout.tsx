import { notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import ChatProvider from '@/components/chat/ChatProvider';
import {
  createPecusApiClients,
  detect401ValidationError,
  detect404ValidationError,
} from '@/connectors/api/PecusApiClient';
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
 *
 * エラーハンドリング:
 * - 401: /signin へリダイレクト
 * - 404: notFound() で not-found.tsx を表示
 * - その他: エラーを再スローして error.tsx で表示
 */
export default async function WorkspaceFullLayout({ children }: WorkspaceFullLayoutProps) {
  let appSettings: AppPublicSettingsResponse = defaultAppSettings;

  try {
    const api = createPecusApiClients();
    appSettings = await api.profile.getApiProfileAppSettings();
  } catch (error) {
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    if (detect404ValidationError(error)) {
      notFound();
    }
    // その他のエラーは再スローして error.tsx に任せる
    throw error;
  }

  return (
    <SignalRProvider>
      <AppSettingsProvider settings={appSettings}>
        {children}
        {/* Chat Bottom Drawer (PC only) */}
        {appSettings.currentUser.id !== 0 && <ChatProvider currentUserId={appSettings.currentUser.id} />}
      </AppSettingsProvider>
    </SignalRProvider>
  );
}
