/**
 * FragmentLinkPlugin
 *
 * #で始まるフラグメントリンク（目次など）をクリックした際に、
 * 対応する見出しにスクロールする処理を行うプラグイン。
 *
 * DOM イベントレベルで処理することで、ClickableLinkPlugin より先に
 * フラグメントリンクをインターセプトする。
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import { $getRoot } from 'lexical';
import type { JSX } from 'react';
import { useEffect } from 'react';

/**
 * 見出しテキストからslug（ID）を生成
 * Markdown互換のslug生成ロジック
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * テキストを正規化（比較用）
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

export default function FragmentLinkPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute('href');

      // #で始まるフラグメントリンクのみ処理
      if (!href || !href.startsWith('#')) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const targetFragment = decodeURIComponent(href.slice(1)); // #を除去してデコード
      const targetSlug = generateSlug(targetFragment);
      const targetNormalized = normalizeText(targetFragment);

      // 見出しノードを検索
      editor.getEditorState().read(() => {
        const root = $getRoot();

        for (const child of root.getChildren()) {
          if ($isHeadingNode(child)) {
            const headingText = child.getTextContent();
            const headingSlug = generateSlug(headingText);
            const headingNormalized = normalizeText(headingText);

            // slug一致、正規化テキスト一致、または部分一致で見出しを見つける
            if (
              headingSlug === targetSlug ||
              headingNormalized === targetNormalized ||
              headingNormalized.includes(targetNormalized) ||
              targetNormalized.includes(headingNormalized)
            ) {
              const domElement = editor.getElementByKey(child.getKey());
              if (domElement) {
                domElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
              }
            }
          }
        }
      });
    };

    // capture フェーズで処理することで ClickableLinkPlugin より先にイベントを捕捉
    rootElement.addEventListener('click', handleClick, true);

    return () => {
      rootElement.removeEventListener('click', handleClick, true);
    };
  }, [editor]);

  return null;
}
