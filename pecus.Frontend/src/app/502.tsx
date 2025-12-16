'use client';

import Link from 'next/link';

export default function BadGatewayPage() {
  return (
    <div className="relative flex items-center justify-center flex-1 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 背景アニメーション用の浮遊要素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 紫系グラデーション円 */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-32 right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 text-center px-4 sm:px-6">
        {/* エラーコード */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent mb-4 animate-pulse">
            502
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mx-auto mb-6"></div>
        </div>

        {/* エラータイトル */}
        <div className="mb-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">ゲートウェイエラー</h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-md mx-auto">
            申し訳ございません。サーバーが一時的に応答できません。しばらく時間を置いてからもう一度お試しください。
          </p>
        </div>

        {/* アイコン */}
        <div className="mb-10 flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 mb-6 max-w-xs mx-auto">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
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
            className="text-purple-400 hover:text-purple-300 transition-colors duration-200 ml-1"
          >
            サポートにお問い合わせください
          </a>
        </p>
      </div>
    </div>
  );
}
