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
    <div className={`flex-shrink-0 size-10 rounded-full ${config.bgClass} flex items-center justify-center`}>
      {iconUrl ? (
        <img src={iconUrl} alt={username ?? ''} className="size-10 rounded-full" />
      ) : (
        <span className={`${config.iconClass} size-5 ${config.iconColorClass}`} aria-hidden="true" />
      )}
    </div>
  );
}

/** メッセージ本文コンポーネント */
function MessageContent({ content, className }: { content: string | null | undefined; className: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: convertToLinks(content ?? '') }} />;
}

/** タイムスタンプコンポーネント */
function Timestamp({ createdAt }: { createdAt: string | null | undefined }) {
  if (!createdAt) return null;
  return <div className="text-xs text-base-content/50 mt-1">{formatRelativeTime(createdAt)}</div>;
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
    <div className="flex justify-start my-2">
      <div className="flex items-start gap-2 max-w-4/5">
        {avatar}
        <div>
          <div className="text-xs text-base-content/70 mb-1">{displayName}</div>
          <MessageContent
            content={content}
            className="bg-base-300 text-base-content px-3 py-2 rounded-lg rounded-tl-none wrap-break-word whitespace-pre-wrap"
          />
          <Timestamp createdAt={createdAt} />
        </div>
      </div>
    </div>
  );
}

/** アバター設定マップ */
const AVATAR_CONFIGS = {
  system: {
    bgClass: 'bg-base-300',
    iconClass: 'icon-[tabler--settings-automation]',
    iconColorClass: 'text-base-content/70',
  },
  ai: {
    bgClass: 'bg-secondary',
    iconClass: 'icon-[tabler--robot]',
    iconColorClass: 'text-secondary-content',
  },
  user: {
    bgClass: 'bg-base-300',
    iconClass: 'icon-[tabler--user]',
    iconColorClass: 'text-base-content/70',
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
      <div className="flex justify-end my-2">
        <div className="max-w-4/5">
          <MessageContent
            content={content}
            className="bg-primary text-primary-content px-3 py-2 rounded-lg rounded-tr-none wrap-break-word whitespace-pre-wrap"
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
    <LeftAlignedMessage
      avatar={<Avatar iconUrl={sender?.identityIconUrl} username={sender?.username} config={AVATAR_CONFIGS.user} />}
      displayName={sender?.username || '不明'}
      content={content}
      createdAt={createdAt}
    />
  );
}
