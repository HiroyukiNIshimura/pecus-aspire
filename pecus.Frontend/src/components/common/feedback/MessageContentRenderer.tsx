import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { remarkItemCodeLinks } from '@/libs/markdown/remarkItemCodeLinks';
import { remarkMentions } from '@/libs/markdown/remarkMentions';
import { convertToLinks } from '@/libs/utils/autoLink';
import { highlightMentions, type MentionItem } from '@/libs/utils/mention';

export type MessageContentMode = 'plain' | 'markdown';
export type MessageContentTone = 'default' | 'primary';

interface MessageContentRendererProps {
  content: string | null | undefined;
  mentions?: MentionItem[];
  workspaceCode?: string;
  mode?: MessageContentMode;
  tone?: MessageContentTone;
  className?: string;
  fallback?: ReactNode;
}

const messageContentClassName =
  'chat-bubble !text-left wrap-break-word whitespace-pre-wrap ' +
  '[&_a]:text-primary [&_a]:underline [&_a]:transition-all [&_a]:duration-150 ' +
  '[&_a:hover]:text-info-content [&_a:hover]:opacity-80 [&_a:hover]:underline-offset-2';

const markdownContentBaseClassName =
  'prose prose-sm max-w-none ' +
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
  workspaceCode,
  mode = 'plain',
  tone = 'default',
  className,
  fallback,
}: MessageContentRendererProps) {
  const linkColorClassName = tone === 'primary' ? '[&_a]:text-primary-content' : '[&_a]:text-primary';
  const toneTextClassName = tone === 'primary' ? 'text-primary-content' : '';
  const classes = [messageContentClassName, linkColorClassName, toneTextClassName, className].filter(Boolean).join(' ');

  if (content == null || content === '') {
    return <div className={classes}>{fallback}</div>;
  }

  if (mode === 'markdown') {
    const markdownToneClassName =
      tone === 'primary'
        ? 'message-content--primary prose-invert prose-headings:text-primary-content prose-th:text-primary-content'
        : 'prose-neutral dark:prose-invert';

    return (
      <div className={`${classes} ${markdownContentBaseClassName} ${markdownToneClassName}`}>
        <Markdown
          remarkPlugins={[remarkGfm, remarkBreaks, [remarkItemCodeLinks, { workspaceCode }], remarkMentions]}
          components={{
            a: ({ href, children }) => {
              const external = isExternalUrl(href);
              return (
                <a
                  href={href}
                  className={`${tone === 'primary' ? 'text-primary-content' : 'text-primary'} underline transition-all duration-150 hover:text-info-content hover:opacity-80 hover:underline-offset-2`}
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

  const linkedContent = convertToLinks(content, workspaceCode);
  const contentWithMentions = highlightMentions(linkedContent, mentions);

  return <div className={classes} dangerouslySetInnerHTML={{ __html: contentWithMentions }} />;
}
