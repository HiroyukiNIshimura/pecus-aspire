import { Suspense } from 'react';
import PasswordResetFormClient from './PasswordResetFormClient';

/**
 * パスワードリセットページ (Server Component)
 *
 * 既存ユーザーがパスワードをリセットするためのページ。
 * パスワードリセットをリクエスト後、メールで送信されるURLからアクセスする。
 *
 * SSR ルール:
 * - export const dynamic = 'force-dynamic' を設定
 * - Proxy でセッション Cookie をクリアするため、認証チェック不要
 */
export const dynamic = 'force-dynamic';

export default async function PasswordResetPage() {
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
