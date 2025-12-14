import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
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
 * - AppHeader/DashboardSidebar は適用しない（各ページが独自管理）
 *
 * 対象: /workspaces/[code]
 */
export default async function WorkspaceFullLayout({ children }: WorkspaceFullLayoutProps) {
  try {
    const api = createPecusApiClients();
    // ユーザー情報を取得して認証状態を確認
    await api.profile.getApiProfile();
  } catch (error) {
    // 401 エラーの場合はログインページにリダイレクト
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    // その他のエラーはログに記録（ページの描画は続行）
    const errorDetail = parseErrorResponse(error);
    console.error('WorkspaceFullLayout: Failed to verify auth', errorDetail);
  }

  return <SignalRProvider>{children}</SignalRProvider>;
}
