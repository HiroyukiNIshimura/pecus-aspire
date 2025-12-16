import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 装飾的な背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        {/* コンテンツ */}
        <div className="relative z-10">
          {/* 404 テキスト */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 animate-pulse">
              404
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto mb-6"></div>
          </div>

          {/* メッセージ */}
          <div className="space-y-4 mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white">ページが見つかりません</h2>
            <p className="text-lg sm:text-xl text-gray-300">
              お探しのページは存在しないか、削除された可能性があります。
            </p>
          </div>

          {/* アイコン */}
          <div className="mb-10 flex justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 mb-6 max-w-xs mx-auto">
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
            >
              ホームに戻る
            </Link>
            <Link
              href="/signin"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-slate-500/50"
            >
              ログインページへ
            </Link>
          </div>

          {/* サポートリンク */}
          <p className="text-sm text-gray-400 mt-8">
            問題が解決しない場合は
            <a
              href="mailto:support@example.com"
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 ml-1"
            >
              サポートにお問い合わせください
            </a>
          </p>
        </div>
      </div>

      {/* アニメーション定義 */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }
        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
