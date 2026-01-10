'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * グローバルエラーページ
 *
 * Next.js App Router のエラーバウンダリとして機能し、
 * Server Component / Client Component で throw されたエラーをキャッチして表示する。
 *
 * 500, 502, 503 など全てのサーバーエラーをこのページで処理する。
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center flex-1 bg-base-200">
      <div className="text-center px-4 sm:px-6">
        {/* アイコン */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
            <span className="icon-[mdi--alert-circle-outline] size-8 text-base-content/60" aria-hidden="true" />
          </div>
        </div>

        {/* エラータイトル */}
        <h1 className="text-2xl font-semibold text-base-content mb-3">エラーが発生しました</h1>
        <p className="text-base-content/60 mb-8">
          申し訳ございません。予期しないエラーが発生しました。
          <br />
          しばらく時間を置いてからもう一度お試しください。
        </p>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" onClick={() => reset()} className="btn btn-primary btn-sm">
            もう一度試す
          </button>
          <Link href="/" className="btn btn-secondary btn-sm">
            ホームに戻る
          </Link>
        </div>

        {/* サポートリンク */}
        <p className="text-xs text-base-content/40 mt-10">問題が解決しない場合はサポートにお問い合わせください</p>
      </div>
    </div>
  );
}
