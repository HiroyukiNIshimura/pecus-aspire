import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/actions/auth';
import PasswordSetupFormClient from './PasswordSetupFormClient';

/**
 * パスワード設定ページ (Server Component)
 *
 * 新規ユーザーが初めてパスワードを設定するためのページ。
 * 組織登録時に管理者ユーザーへ送信されるメールに含まれるURLからアクセスする。
 *
 * SSR ルール:
 * - export const dynamic = 'force-dynamic' を設定
 * - Server Actions で認証状態をチェック
 * - ログイン済みユーザーは / にリダイレクト
 * - 未認証なら PasswordSetupFormClient をレンダリング
 */
export const dynamic = 'force-dynamic';

export default async function PasswordSetupPage() {
  // ログイン済みユーザーはダッシュボードへリダイレクト
  let currentUser = null;
  try {
    const result = await getCurrentUser();
    if (result.success && result.data) {
      currentUser = result.data;
    }
  } catch (err) {
    console.error('認証状態の確認中にエラーが発生:', err);
  }

  if (currentUser) {
    redirect('/');
  }

  return (
    <div className="font-sans flex items-center justify-center flex-1 p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-sm">
        <Suspense>
          <PasswordSetupFormClient />
        </Suspense>
      </main>
    </div>
  );
}
