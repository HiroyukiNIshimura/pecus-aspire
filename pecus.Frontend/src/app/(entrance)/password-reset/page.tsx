import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/actions/auth';
import PasswordResetFormClient from './PasswordResetFormClient';

/**
 * パスワードリセットページ (Server Component)
 *
 * 既存ユーザーがパスワードをリセットするためのページ。
 * パスワードリセットをリクエスト後、メールで送信されるURLからアクセスする。
 *
 * SSR ルール:
 * - export const dynamic = 'force-dynamic' を設定
 * - Server Actions で認証状態をチェック
 * - ログイン済みユーザーは / にリダイレクト
 * - 未認証なら PasswordResetFormClient をレンダリング
 */
export const dynamic = 'force-dynamic';

export default async function PasswordResetPage() {
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
          <PasswordResetFormClient />
        </Suspense>
      </main>
    </div>
  );
}
