import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
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
  'chat-bubble !text-left wrap-break-word whitespace-pre-wrap [&_a]:text-primary [&_a]:underline [&_a:hover]:text-info-content';

const markdownContentClassName =
  'prose prose-sm prose-neutral dark:prose-invert max-w-none ' +
  'prose-headings:mt-1 prose-headings:mb-0 prose-headings:font-semibold ' +
  'prose-h1:text-lg prose-h2:text-base prose-h3:text-sm ' +
  'prose-p:mt-0 prose-p:mb-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 ' +
  'prose-blockquote:my-1 prose-blockquote:pl-3 prose-pre:my-1 prose-pre:overflow-x-auto prose-pre:p-2 ' +
  'prose-code:break-words prose-table:my-1 prose-table:text-xs prose-hr:my-2';

function isExternalUrl(href: string | undefined): boolean {
  return Boolean(href && /^(https?:)?\/\//i.test(href));
}

/**
 * チャット・コメント本文の共通レンダラー。
 * Markdown本文はraw HTMLを許可せず、GFM・内部リンク・メンションを共通処理する。
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
      <div className={`${classes} ${markdownContentClassName}`}>
        <Markdown
          remarkPlugins={[remarkGfm, remarkBreaks, remarkItemCodeLinks, remarkMentions]}
          components={{
            a: ({ href, children }) => {
              const external = isExternalUrl(href);
              return (
                <a
                  href={href}
                  className="text-primary underline hover:text-info-content"
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {children}
                </a>
              );
            },
            p: ({ children, ...props }) => (
              <p {...props} className="my-0!">
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul {...props} className="my-0.5!">
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol {...props} className="my-0.5!">
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li {...props} className="my-0! py-0! leading-snug!">
                {children}
              </li>
            ),
          }}
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
