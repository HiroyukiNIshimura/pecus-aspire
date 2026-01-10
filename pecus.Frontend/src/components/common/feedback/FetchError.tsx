import Link from 'next/link';

interface FetchErrorProps {
  /** エラーメッセージ */
  message?: string;
  /** 戻り先のURL（省略時はホーム） */
  backUrl?: string;
  /** 戻りボタンのラベル */
  backLabel?: string;
  /** 再試行ボタンを表示するか */
  showRetry?: boolean;
  /** 再試行時の処理 */
  onRetry?: () => void;
}

/**
 * データ取得エラー表示コンポーネント
 *
 * APIからのデータ取得に失敗した際に表示する。
 * Server Component から使用可能（onRetry を使わない場合）。
 */
export default function FetchError({
  message = 'データの取得に失敗しました',
  backUrl = '/',
  backLabel = 'ホームに戻る',
  showRetry = false,
  onRetry,
}: FetchErrorProps) {
  return (
    <div className="flex items-center justify-center flex-1 bg-base-200">
      <div className="text-center px-4 sm:px-6 max-w-md">
        {/* アイコン */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
            <span className="icon-[mdi--cloud-off-outline] size-8 text-base-content/60" aria-hidden="true" />
          </div>
        </div>

        {/* エラータイトル */}
        <h1 className="text-2xl font-semibold text-base-content mb-3">データを取得できませんでした</h1>
        <p className="text-base-content/60 mb-8">{message}</p>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRetry && onRetry && (
            <button type="button" onClick={onRetry} className="btn btn-primary btn-sm">
              もう一度試す
            </button>
          )}
          <Link href={backUrl} className="btn btn-secondary btn-sm">
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
