/**
 * InsertMarkdownPlugin
 *
 * 外部からMarkdownテキストをエディタに挿入するためのプラグイン。
 * カスタムコマンドを使用して、既存のコンテンツを保持したまま
 * Markdownをエディタの末尾に追記する。
 */

import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, COMMAND_PRIORITY_EDITOR, createCommand, type LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import { PLAYGROUND_TRANSFORMERS } from '../MarkdownTransformers';

/**
 * Markdownを挿入するためのカスタムコマンド
 */
export const INSERT_MARKDOWN_COMMAND: LexicalCommand<string> = createCommand('INSERT_MARKDOWN_COMMAND');

export default function InsertMarkdownPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<string>(
      INSERT_MARKDOWN_COMMAND,
      (markdown) => {
        if (!markdown || markdown.trim().length === 0) {
          return false;
        }

        editor.update(() => {
          // 現在のコンテンツをMarkdownとして取得
          const currentMarkdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);

          // 現在のコンテンツと新しいマークダウンを結合
          const combinedMarkdown = currentMarkdown.trim()
            ? `${currentMarkdown.trim()}\n\n${markdown}`
            : markdown;

          // ルートをクリアして結合したマークダウンを変換
          const root = $getRoot();
          root.clear();
          $convertFromMarkdownString(combinedMarkdown, PLAYGROUND_TRANSFORMERS);

          // 最後のノードを選択
          const newLastChild = root.getLastChild();
          newLastChild?.selectEnd();
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
