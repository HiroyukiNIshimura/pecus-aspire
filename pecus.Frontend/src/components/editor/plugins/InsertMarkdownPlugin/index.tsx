/**
 * InsertMarkdownPlugin
 *
 * 外部からMarkdownテキストをエディタに挿入するためのプラグイン。
 * カスタムコマンドを使用して、既存のコンテンツを保持したまま
 * Markdownをエディタの末尾に追記する。
 */

import { $convertFromMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  type LexicalNode,
} from 'lexical';
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
          const root = $getRoot();

          // 空の段落ノードを作成してマークダウンを変換
          const paragraphNode = $createParagraphNode();

          // マークダウンを Lexical ノードに変換
          $convertFromMarkdownString(markdown, PLAYGROUND_TRANSFORMERS, paragraphNode, true);

          // 変換されたノードを取得
          const children = paragraphNode.getChildren();

          if (children.length > 0) {
            // 現在のコンテンツの最後のノードを取得
            const lastChild = root.getLastChild();

            if (lastChild) {
              // 最後のノードが空の段落の場合は、そこに挿入
              const isEmptyParagraph = lastChild.getType() === 'paragraph' && lastChild.getTextContent().trim() === '';

              let insertAfterNode: LexicalNode = lastChild;

              // 空でない場合は最後のノードの後に挿入
              for (const child of children) {
                insertAfterNode.insertAfter(child);
                insertAfterNode = child;
              }

              // 元の空の段落を削除
              if (isEmptyParagraph) {
                lastChild.remove();
              }

              // カーソルを最後に挿入したノードの末尾に移動
              insertAfterNode.selectEnd();
            } else {
              // ルートが空の場合は直接追加
              for (const child of children) {
                root.append(child);
              }
              // 最後のノードを選択
              const newLastChild = root.getLastChild();
              newLastChild?.selectEnd();
            }
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
