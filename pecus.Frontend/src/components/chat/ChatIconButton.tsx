'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useChatStore } from '@/stores/chatStore';
import ChatUnreadBadge from './ChatUnreadBadge';

/**
 * ヘッダーのチャットアイコンボタン
 * - スマホ: /chat へフル画面遷移（/chat にいる場合は戻る）
 * - PC: ボトムドロワーをトグル
 */
export default function ChatIconButton() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { toggleDrawer } = useChatStore();

  // チャットページにいるかどうか
  const isOnChatPage = pathname?.startsWith('/chat');

  const handleClick = () => {
    if (isMobile) {
      if (isOnChatPage) {
        // スマホ: チャットページにいる場合は戻る
        router.back();
      } else {
        // スマホ: フル画面遷移
        router.push('/chat');
      }
    } else {
      // PC: ボトムドロワーをトグル
      toggleDrawer();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="btn btn-ghost btn-circle relative mr-2"
      aria-label="チャット"
    >
      <span className="icon-[tabler--message-circle] size-6" aria-hidden="true" />
      <ChatUnreadBadge />
    </button>
  );
}
