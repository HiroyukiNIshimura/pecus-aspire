import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/actions/auth';
import LoginFormClient from './LoginFormClient';

/**
 * ログインページ (Server Component)
 *
 * SSR ルール:
 * - export const dynamic = 'force-dynamic' を設定
 * - Server Actions で認証状態をチェック
 * - 既にログイン済みなら /admin にリダイレクト
 * - 未認証なら LoginFormClient をレンダリング
 */
export const dynamic = 'force-dynamic';

export default async function SignInPage() {
  // === 認証チェック: 既にログイン済みなら /admin へリダイレクト ===
  // 未認証ユーザー向けのページなので、ログイン済みはアクセス不可
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
    <div className="font-sans flex items-center justify-center min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-sm">
        <Suspense>
          <LoginFormClient />
        </Suspense>
      </main>
    </div>
  );
}
