export interface MentionItem {
  displayName?: string | null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * HTML内のテキスト部分にのみメンション装飾を適用する。
 * 既存リンクなどのHTMLタグは置換対象から除外する。
 */
export function highlightMentions(html: string, mentions: MentionItem[] = []): string {
  if (!html) {
    return html;
  }

  const chunks = html.split(/(<[^>]+>)/g);
  const uniqueMentionTokens = Array.from(
    new Set(
      mentions
        .map((mention) => mention.displayName?.trim())
        .filter((displayName): displayName is string => Boolean(displayName))
        .map((displayName) => `@${displayName}`),
    ),
  ).sort((a, b) => b.length - a.length);

  return chunks
    .map((chunk) => {
      if (chunk.startsWith('<') && chunk.endsWith('>')) {
        return chunk;
      }

      if (uniqueMentionTokens.length > 0) {
        let highlighted = chunk;

        for (const token of uniqueMentionTokens) {
          const mentionRegex = new RegExp(`(^|\\s)(${escapeRegExp(token)})(?=\\s|$)`, 'g');
          highlighted = highlighted.replace(mentionRegex, (_match, prefix: string, mention: string) => {
            return `${prefix}<span class="font-semibold text-secondary-content">${mention}</span>`;
          });
        }

        return highlighted;
      }

      // mentions がない場合も、従来どおり一般的なメンションを装飾する。
      const mentionRegex = /(^|\s)(@[^\s@]{1,100})/g;
      return chunk.replace(mentionRegex, (_match, prefix: string, mention: string) => {
        return `${prefix}<span class="font-semibold text-secondary-content">${mention}</span>`;
      });
    })
    .join('');
}
