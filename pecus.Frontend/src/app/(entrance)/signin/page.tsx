import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/actions/auth';
import { getProfileAppSettingsWithHeyApi } from '@/connectors/HeyApiClient';
import LoginFormClient from './LoginFormClient';

/**
 * ログインページ (Server Component)
 *
 * SSR ルール:
 * - export const dynamic = 'force-dynamic' を設定
 * - Server Actions で認証状態をチェック
 * - 既にログイン済みならダッシュボードにリダイレクト
 * - 未認証なら LoginFormClient をレンダリング
 */
export const dynamic = 'force-dynamic';

/** セッション有効性チェックのタイムアウト（ミリ秒） */
const SESSION_CHECK_TIMEOUT_MS = 2500;

/**
 * セッションが API 側でも有効かを確認する
 *
 * Redis にセッションが残っていても、トークン失効やユーザー削除により API が 401 を返す場合がある。
 * その状態でダッシュボードへ戻すと「/ → 401 → /signin → /」の無限リダイレクトになる。
 * API が応答しない場合にログイン画面が表示されなくなるため、タイムアウト時は未ログイン扱いにする。
 */
async function isSessionUsable(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      getProfileAppSettingsWithHeyApi(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('session check timeout')), SESSION_CHECK_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export default async function SignInPage() {
  // === 認証チェック: 既にログイン済みならダッシュボードへリダイレクト ===
  // 未認証ユーザー向けのページなので、ログイン済みはアクセス不可
  let currentUser = null;
  try {
    const result = await getCurrentUser();
    if (result.success && result.data && (await isSessionUsable())) {
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
          <LoginFormClient />
        </Suspense>
      </main>
    </div>
  );
}
