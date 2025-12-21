'use client';

import type { ChatMessageItem } from '@/connectors/api/pecus';
import { convertToLinks } from '@/libs/utils/autoLink';
import { formatRelativeTime } from '@/libs/utils/date';

interface ChatMessageItemComponentProps {
  message: ChatMessageItem;
  isOwnMessage: boolean;
  /** 既読表示を表示するか（DM用） */
  showReadStatus?: boolean;
}

/**
 * メッセージ1件のコンポーネント
 * - 自分のメッセージ: 右寄せ、プライマリカラー
 * - 相手のメッセージ: 左寄せ、グレー
 * - システム/AI: 中央、特別スタイル
 */
export default function ChatMessageItemComponent({
  message,
  isOwnMessage,
  showReadStatus = false,
}: ChatMessageItemComponentProps) {
  const { messageType, content, sender, createdAt } = message;

  // システムメッセージ
  if (messageType === 'System') {
    return (
      <div className="flex justify-center my-2">
        <div
          className="bg-base-300 text-base-content/70 text-xs px-3 py-1 rounded-full"
          dangerouslySetInnerHTML={{ __html: convertToLinks(content ?? '') }}
        />
      </div>
    );
  }

  // AI メッセージ
  if (messageType === 'Ai') {
    return (
      <div className="flex justify-start my-2">
        <div className="flex items-start gap-2 max-w-[80%]">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="icon-[tabler--robot] size-5 text-secondary-content" aria-hidden="true" />
          </div>
          <div>
            <div
              className="bg-secondary/20 text-base-content px-3 py-2 rounded-lg rounded-tl-none"
              dangerouslySetInnerHTML={{ __html: convertToLinks(content ?? '') }}
            />
            <div className="text-xs text-base-content/50 mt-1">{createdAt && formatRelativeTime(createdAt)}</div>
          </div>
        </div>
      </div>
    );
  }

  // 通常メッセージ（自分）
  if (isOwnMessage) {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-[80%]">
          <div
            className="bg-primary text-primary-content px-3 py-2 rounded-lg rounded-tr-none"
            dangerouslySetInnerHTML={{ __html: convertToLinks(content ?? '') }}
          />
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-xs text-base-content/50">{createdAt && formatRelativeTime(createdAt)}</span>
            {showReadStatus && <span className="text-xs text-primary">既読</span>}
          </div>
        </div>
      </div>
    );
  }

  // 通常メッセージ（相手）
  return (
    <div className="flex justify-start my-2">
      <div className="flex items-start gap-2 max-w-[80%]">
        {/* アバター */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-base-300 flex items-center justify-center">
          {sender?.identityIconUrl ? (
            <img src={sender.identityIconUrl} alt={sender.username} className="w-12 h-12 rounded-full" />
          ) : (
            <span className="icon-[tabler--user] size-5 text-base-content/70" aria-hidden="true" />
          )}
        </div>
        <div>
          {/* 送信者名 */}
          <div className="text-xs text-base-content/70 mb-1">{sender?.username || '不明'}</div>
          <div
            className="bg-base-300 text-base-content px-3 py-2 rounded-lg rounded-tl-none"
            dangerouslySetInnerHTML={{ __html: convertToLinks(content ?? '') }}
          />
          <div className="text-xs text-base-content/50 mt-1">{createdAt && formatRelativeTime(createdAt)}</div>
        </div>
      </div>
    </div>
  );
}
