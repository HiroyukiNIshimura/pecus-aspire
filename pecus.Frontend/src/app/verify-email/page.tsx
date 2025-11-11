import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const dynamic = "force-dynamic";

/**
 * メールアドレス変更確認ページ（SSR）
 * クエリパラメータ token を受け取り、クライアントコンポーネントで検証処理を実行
 */
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <Suspense
        fallback={
          <div className="card bg-base-100 shadow-xl max-w-md w-full">
            <div className="card-body items-center text-center">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="text-base-content/70 mt-4">読み込み中...</p>
            </div>
          </div>
        }
      >
        <VerifyEmailClient />
      </Suspense>
    </div>
  );
}
