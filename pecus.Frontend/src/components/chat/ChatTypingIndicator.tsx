'use client';

interface TypingUser {
  userId: number;
  userName: string;
}

interface BotTyping {
  botName: string;
}

interface ChatTypingIndicatorProps {
  /** 入力中のユーザー一覧 */
  typingUsers: TypingUser[];
  /** Bot の入力中状態（AI ルームで AI が返信生成中の場合） */
  botTyping?: BotTyping | null;
}

/**
 * 入力中インジケーターコンポーネント
 * 「〇〇さんが入力中...」または「Bot名が考え中...」を表示
 */
export default function ChatTypingIndicator({ typingUsers, botTyping }: ChatTypingIndicatorProps) {
  // ユーザーも Bot も入力中でない場合は何も表示しない
  if (typingUsers.length === 0 && !botTyping) {
    return null;
  }

  // 表示テキストを生成
  const getTypingText = () => {
    // Bot が入力中（AI が返信生成中）
    if (botTyping) {
      return `${botTyping.botName}が考え中`;
    }

    // ユーザーが入力中
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName}さんが入力中`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].userName}さんと${typingUsers[1].userName}さんが入力中`;
    }
    return `${typingUsers[0].userName}さんと他${typingUsers.length - 1}人が入力中`;
  };

  // Bot の場合は紫色のドット、ユーザーの場合は緑色のドット
  const dotColorClass = botTyping ? 'bg-violet-400' : 'bg-emerald-400';

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-sm text-base-content/60">
      {/* アニメーションドット */}
      <div className="flex items-center gap-0.5">
        <span className={`w-1.5 h-1.5 ${dotColorClass} rounded-full animate-bounce [animation-delay:-0.3s]`} />
        <span className={`w-1.5 h-1.5 ${dotColorClass} rounded-full animate-bounce [animation-delay:-0.15s]`} />
        <span className={`w-1.5 h-1.5 ${dotColorClass} rounded-full animate-bounce`} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}
