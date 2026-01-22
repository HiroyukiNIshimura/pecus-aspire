import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center flex-1 bg-base-200">
      <div className="text-center px-4 sm:px-6">
        {/* アイコン */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
            <span className="icon-[mdi--file-search-outline] size-8 text-base-content/60" aria-hidden="true" />
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-semibold text-base-content mb-3">ページが見つかりません</h1>
        <p className="text-base-content/60 mb-8">
          お探しのページは存在しないか、削除された可能性があります。
          <br />
          URLをご確認の上、もう一度お試しください。
        </p>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary btn-sm">
            ホームに戻る
          </Link>
        </div>

        {/* サポートリンク */}
        <p className="text-xs text-base-content/40 mt-10">問題が解決しない場合はサポートにお問い合わせください</p>
      </div>
    </div>
  );
}
