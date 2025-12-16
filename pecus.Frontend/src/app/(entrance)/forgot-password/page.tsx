import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/actions/auth';
import ForgotPasswordFormClient from './ForgotPasswordFormClient';

/**
 * パスワード忘却ページ (Server Component)
 *
 * SSR ルール:
 * - export const dynamic = 'force-dynamic' を設定
 * - Server Actions で認証状態をチェック
 * - ログイン済みユーザーは /admin にリダイレクト
 * - 未認証なら ForgotPasswordFormClient をレンダリング
 */
export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage() {
  // === 認証チェック: ログイン済みなら /admin へリダイレクト ===
  // パスワード忘却ページは未認証ユーザー向け
  let currentUser = null;
  try {
    const result = await getCurrentUser();
    if (result.success && result.data) {
      currentUser = result.data;
    }
  } catch (err) {
    console.error('認証状態の確認中にエラーが発生:', err);
  }

  // ログイン済みユーザーはダッシュボードへリダイレクト
  if (currentUser) {
    redirect('/');
  }

  return (
    <div className="font-sans flex items-center justify-center flex-1 p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-sm">
        <Suspense>
          <ForgotPasswordFormClient />
        </Suspense>
      </main>
    </div>
  );
}
