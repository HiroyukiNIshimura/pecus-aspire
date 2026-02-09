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

/** アバター設定 */
interface AvatarConfig {
  bgClass: string;
  iconClass: string;
  iconColorClass: string;
}

/** アバターコンポーネント */
function Avatar({
  iconUrl,
  username,
  config,
}: {
  iconUrl?: string | null;
  username?: string | null;
  config: AvatarConfig;
}) {
  return (
    <div className="chat-avatar avatar">
      <div className={`size-10 rounded-full ${config.bgClass} flex items-center justify-center`}>
        {iconUrl ? (
          <img src={iconUrl} alt={username ?? ''} className="size-10 rounded-full" />
        ) : (
          <span className={`${config.iconClass} size-5 ${config.iconColorClass}`} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

/** メッセージ本文コンポーネント */
function MessageContent({ content }: { content: string | null | undefined }) {
  return (
    <div
      className="chat-bubble wrap-break-word whitespace-pre-wrap [&_a]:text-primary [&_a]:underline [&_a:hover]:text-info-content"
      dangerouslySetInnerHTML={{ __html: convertToLinks(content ?? '') }}
    />
  );
}

/** 左寄せメッセージ（相手・システム・AI用）*/
function LeftAlignedMessage({
  avatar,
  displayName,
  content,
  createdAt,
}: {
  avatar: React.ReactNode;
  displayName: string;
  content: string | null | undefined;
  createdAt: string | null | undefined;
}) {
  return (
    <div className="chat chat-receiver">
      {avatar}
      <div className="chat-header text-base-content">
        {displayName}
        {createdAt && <time className="text-base-content/50 ml-2">{formatRelativeTime(createdAt)}</time>}
      </div>
      <MessageContent content={content} />
    </div>
  );
}

/** アバター設定マップ */
const AVATAR_CONFIGS = {
  system: {
    bgClass: 'bg-amber-100',
    iconClass: 'icon-[tabler--settings-automation]',
    iconColorClass: 'text-success-content',
  },
  ai: {
    bgClass: 'bg-amber-100',
    iconClass: 'icon-[tabler--robot]',
    iconColorClass: 'text-success-content',
  },
  user: {
    bgClass: 'bg-amber-100',
    iconClass: 'icon-[tabler--user]',
    iconColorClass: 'text-success-content',
  },
} as const;

/**
 * メッセージ1件のコンポーネント
 * - 自分のメッセージ: 右寄せ、プライマリカラー
 * - 相手のメッセージ: 左寄せ、グレー
 * - システム/AI: 左寄せ、特別スタイル
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
      <LeftAlignedMessage
        avatar={<Avatar iconUrl={sender?.identityIconUrl} username={sender?.username} config={AVATAR_CONFIGS.system} />}
        displayName={sender?.username || 'システム'}
        content={content}
        createdAt={createdAt}
      />
    );
  }

  // AI メッセージ
  if (messageType === 'Ai') {
    return (
      <LeftAlignedMessage
        avatar={<Avatar iconUrl={null} username={null} config={AVATAR_CONFIGS.ai} />}
        displayName={sender?.username || 'AI'}
        content={content}
        createdAt={createdAt}
      />
    );
  }

  // 通常メッセージ（自分）
  if (isOwnMessage) {
    return (
      <div className="chat chat-sender">
        <div className="chat-header text-base-content">
          {sender?.username || 'あなた'}
          {createdAt && <time className="text-base-content/50 ml-2">{formatRelativeTime(createdAt)}</time>}
        </div>
        <MessageContent content={content} />
        {showReadStatus && (
          <div className="chat-footer text-base-content/50">
            既読
            <span className="icon-[tabler--checks] text-success align-bottom ml-1" aria-hidden="true" />
          </div>
        )}
      </div>
    );
  }

  // 通常メッセージ（相手）
  return (
    <LeftAlignedMessage
      avatar={<Avatar iconUrl={sender?.identityIconUrl} username={sender?.username} config={AVATAR_CONFIGS.user} />}
      displayName={sender?.username || '不明'}
      content={content}
      createdAt={createdAt}
    />
  );
}
