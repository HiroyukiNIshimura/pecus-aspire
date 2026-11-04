import { Suspense } from 'react';
import PasskeySetupFormClient from './PasskeySetupFormClient';

/**
 * パスキー登録ページ (Server Component)
 *
 * 招待メールのリンク（token）またはリカバリーコードの検証後（recoveryToken）にアクセスする。
 * Proxy でセッション Cookie をクリアするため、認証チェックは不要。
 */
export const dynamic = 'force-dynamic';

export default function PasskeySetupPage() {
  return (
    <div className="font-sans flex items-center justify-center flex-1 p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full max-w-md">
        <Suspense>
          <PasskeySetupFormClient />
        </Suspense>
      </main>
    </div>
  );
}
