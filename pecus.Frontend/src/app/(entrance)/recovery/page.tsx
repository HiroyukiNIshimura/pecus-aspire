import { Suspense } from 'react';
import RecoveryFormClient from './RecoveryFormClient';

/**
 * リカバリーコード入力ページ (Server Component)
 *
 * パスキーを失った場合に、リカバリーコードで本人確認を行い
 * パスキー再登録用のトークンを取得する。
 */
export const dynamic = 'force-dynamic';

export default function RecoveryPage() {
  return (
    <div className="font-sans flex items-center justify-center flex-1 p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-md">
        <Suspense>
          <RecoveryFormClient />
        </Suspense>
      </main>
    </div>
  );
}
