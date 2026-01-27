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
    <div
      className={`flex-shrink-0 size-12 rounded-full ${config.bgClass} flex items-center justify-center transition-transform duration-200 hover:scale-150 cursor-pointer`}
    >
      {iconUrl ? (
        <img src={iconUrl} alt={username ?? ''} className="size-12 rounded-full" />
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
            className="bg-neutral text-neutral-content px-3 py-2 rounded-lg rounded-tl-none wrap-break-word whitespace-pre-wrap [&_a]:text-primary [&_a]:underline [&_a:hover]:text-info-content"
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
      <div className="flex justify-end my-2">
        <div className="max-w-4/5">
          <MessageContent
            content={content}
            className="bg-primary text-primary-content px-3 py-2 rounded-lg rounded-tr-none wrap-break-word whitespace-pre-wrap [&_a]:text-primary-content [&_a]:underline [&_a:hover]:text-info-content"
          />
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-xs text-base-content/50">{createdAt && formatRelativeTime(createdAt)}</span>
            {showReadStatus && (
              <span className="text-xs text-success font-medium flex items-center gap-0.5">
                <span className="icon-[tabler--checks] size-3.5" aria-hidden="true" />
                既読
              </span>
            )}
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
