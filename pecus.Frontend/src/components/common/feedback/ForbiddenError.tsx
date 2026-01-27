import Link from 'next/link';

interface ForbiddenErrorProps {
  /** カスタムメッセージ（省略時はデフォルトメッセージ） */
  message?: string;
  /** 戻り先のURL（省略時はホーム） */
  backUrl?: string;
  /** 戻りボタンのラベル */
  backLabel?: string;
}

/**
 * 403 Forbidden エラー表示コンポーネント
 *
 * 権限がないページにアクセスした際に表示する。
 * error.tsx ではなく、ページ内で適切にハンドリングするために使用。
 */
export default function ForbiddenError({
  message = 'このページへのアクセス権限がありません',
  backUrl = '/',
  backLabel = 'ホームに戻る',
}: ForbiddenErrorProps) {
  return (
    <div className="flex items-center justify-center flex-1 bg-base-200">
      <div className="text-center px-4 sm:px-6 max-w-md">
        {/* アイコン */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="icon-[mdi--lock-outline] size-8 text-primary" aria-hidden="true" />
          </div>
        </div>

        {/* エラータイトル */}
        <h1 className="text-2xl font-semibold text-base-content mb-3">アクセスが制限されています</h1>
        <p className="text-base-content/60 mb-8">{message}</p>

        {/* アクションボタン */}
        <div className="flex justify-center">
          <Link href={backUrl} className="btn btn-primary btn-sm">
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
