"use client";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * ページ全体をブロックするローディングオーバーレイコンポーネント
 *
 * @param isLoading - ローディング状態
 * @param message - 表示するメッセージ（デフォルト: "読み込み中..."）
 */
export default function LoadingOverlay({
  isLoading,
  message = "読み込み中...",
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-base-100/40 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-lg">{message}</p>
      </div>
    </div>
  );
}
