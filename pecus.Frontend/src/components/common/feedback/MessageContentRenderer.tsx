import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { remarkItemCodeLinks } from '@/libs/markdown/remarkItemCodeLinks';
import { remarkMentions } from '@/libs/markdown/remarkMentions';
import { convertToLinks } from '@/libs/utils/autoLink';
import { highlightMentions, type MentionItem } from '@/libs/utils/mention';

export type MessageContentMode = 'plain' | 'markdown';

interface MessageContentRendererProps {
  content: string | null | undefined;
  mentions?: MentionItem[];
  mode?: MessageContentMode;
  className?: string;
  fallback?: ReactNode;
}

const messageContentClassName =
  'chat-bubble wrap-break-word whitespace-pre-wrap [&_a]:text-primary [&_a]:underline [&_a:hover]:text-info-content';

/**
 * チャット・コメント本文の共通レンダラー。
 * plain は既存表示を維持し、markdown は将来の本文形式拡張用に利用する。
 */
export default function MessageContentRenderer({
  content,
  mentions = [],
  mode = 'plain',
  className,
  fallback,
}: MessageContentRendererProps) {
  const classes = [messageContentClassName, className].filter(Boolean).join(' ');

  if (content == null || content === '') {
    return <div className={classes}>{fallback}</div>;
  }

  if (mode === 'markdown') {
    return (
      <div className={`${classes} prose prose-sm prose-neutral dark:prose-invert max-w-none`}>
        <Markdown
          remarkPlugins={[remarkBreaks, remarkItemCodeLinks, remarkMentions]}
        >
          {content}
        </Markdown>
      </div>
    );
  }

  const linkedContent = convertToLinks(content);
  const contentWithMentions = highlightMentions(linkedContent, mentions);

  return <div className={classes} dangerouslySetInnerHTML={{ __html: contentWithMentions }} />;
}
