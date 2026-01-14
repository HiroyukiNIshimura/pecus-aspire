import { Suspense } from 'react';
import PasswordSetupFormClient from './PasswordSetupFormClient';

/**
 * パスワード設定ページ (Server Component)
 *
 * 新規ユーザーが初めてパスワードを設定するためのページ。
 * 組織登録時に管理者ユーザーへ送信されるメールに含まれるURLからアクセスする。
 *
 * SSR ルール:
 * - export const dynamic = 'force-dynamic' を設定
 * - Proxy でセッション Cookie をクリアするため、認証チェック不要
 */
export const dynamic = 'force-dynamic';

export default async function PasswordSetupPage() {
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
