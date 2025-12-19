'use client';

interface TypingUser {
  userId: number;
  userName: string;
}

interface ChatTypingIndicatorProps {
  /** 入力中のユーザー一覧 */
  typingUsers: TypingUser[];
}

/**
 * 入力中インジケーターコンポーネント
 * 「〇〇さんが入力中...」を表示
 */
export default function ChatTypingIndicator({ typingUsers }: ChatTypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  // 表示テキストを生成
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName}さんが入力中`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].userName}さんと${typingUsers[1].userName}さんが入力中`;
    }
    return `${typingUsers[0].userName}さんと他${typingUsers.length - 1}人が入力中`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-sm text-base-content/60">
      {/* アニメーションドット */}
      <div className="flex items-center gap-0.5">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}
1;
