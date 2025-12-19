'use client';

import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useChatStore } from '@/stores/chatStore';
import ChatUnreadBadge from './ChatUnreadBadge';

/**
 * ヘッダーのチャットアイコンボタン
 * - スマホ: /chat へフル画面遷移
 * - PC: ボトムドロワーをトグル
 */
export default function ChatIconButton() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toggleDrawer } = useChatStore();

  const handleClick = () => {
    if (isMobile) {
      // スマホ: フル画面遷移
      router.push('/chat');
    } else {
      // PC: ボトムドロワーをトグル
      toggleDrawer();
    }
  };

  return (
    <button type="button" onClick={handleClick} className="btn btn-ghost btn-circle relative" aria-label="チャット">
      <span className="icon-[tabler--message-circle] size-6" aria-hidden="true" />
      <ChatUnreadBadge />
    </button>
  );
}
