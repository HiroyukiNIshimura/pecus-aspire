/**
 * MarkdownPastePlugin
 *
 * マークダウンテキストをペーストした際に、Lexical ノードに変換してインサートするプラグイン。
 * 通常のテキストペースト（Code ブロックとして認識されてしまう問題）を回避する。
 *
 * @see https://github.com/facebook/lexical/issues/7663
 * @see https://payloadcms.com/docs/rich-text/converting-markdown#markdown-to-richtext
 */

import { $convertFromMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  type LexicalNode,
  PASTE_COMMAND,
} from 'lexical';
import { useCallback, useEffect } from 'react';
import { normalizeListIndentation } from '../../transformers/markdown-transformers';
import { PLAYGROUND_TRANSFORMERS } from '../MarkdownTransformers';

/**
 * マークダウンらしいパターンを検出する正規表現群
 */
const MARKDOWN_PATTERNS = {
  // ヘッダー: # Header, ## Header, ### Header
  heading: /^#{1,6}\s+.+/m,
  // 太字: **text** or __text__
  bold: /\*\*[^*]+\*\*|__[^_]+__/,
  // イタリック: *text* or _text_ (太字でないもの)
  italic: /(?<!\*)\*(?!\*)[^*]+\*(?!\*)|(?<!_)_(?!_)[^_]+_(?!_)/,
  // 箇条書きリスト: - item, * item, + item
  unorderedList: /^[\s]*[-*+]\s+.+/m,
  // 番号付きリスト: 1. item, 2. item
  orderedList: /^[\s]*\d+\.\s+.+/m,
  // コードブロック: ```code```
  codeBlock: /```[\s\S]*?```/,
  // インラインコード: `code`
  inlineCode: /`[^`]+`/,
  // リンク: [text](url)
  link: /\[([^\]]+)\]\(([^)]+)\)/,
  // 画像: ![alt](url)
  image: /!\[([^\]]*)\]\(([^)]+)\)/,
  // 引用: > quote
  blockquote: /^>\s+.+/m,
  // 水平線: ---, ***, ___
  horizontalRule: /^(---|\*\*\*|___)\s*$/m,
  // チェックリスト: - [ ] or - [x]
  checklist: /^[\s]*-\s+\[([ xX])\]\s+.+/m,
  // テーブル: | col1 | col2 |
  table: /^\|.+\|$/m,
};

/**
 * テキストがマークダウンかどうかを判定する
 * 複数のパターンがマッチするほど、マークダウンの可能性が高い
 */
function isLikelyMarkdown(text: string): boolean {
  // 空文字やコードっぽいテキスト（{}や;が多い）は除外
  if (!text || text.trim().length === 0) {
    return false;
  }

  // 複数行でない短いテキストは通常のペーストとして扱う
  const lines = text.split('\n');
  if (lines.length === 1 && text.length < 50) {
    // 単一行でも明確なマークダウンパターンがあればOK
    const hasHeading = MARKDOWN_PATTERNS.heading.test(text);
    const hasBold = MARKDOWN_PATTERNS.bold.test(text);
    const hasItalic = MARKDOWN_PATTERNS.italic.test(text);
    const hasLink = MARKDOWN_PATTERNS.link.test(text);
    const hasInlineCode = MARKDOWN_PATTERNS.inlineCode.test(text);

    if (hasHeading || hasBold || hasItalic || hasLink || hasInlineCode) {
      return true;
    }
    return false;
  }

  // マッチしたパターン数をカウント
  let matchCount = 0;

  if (MARKDOWN_PATTERNS.heading.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.bold.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.italic.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.unorderedList.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.orderedList.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.codeBlock.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.inlineCode.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.link.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.image.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.blockquote.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.horizontalRule.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.checklist.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.table.test(text)) matchCount++;

  // 2つ以上のパターンがマッチするか、強いパターン（ヘッダー、コードブロック、リスト）があればマークダウンと判断
  const hasStrongPattern =
    MARKDOWN_PATTERNS.heading.test(text) ||
    MARKDOWN_PATTERNS.codeBlock.test(text) ||
    MARKDOWN_PATTERNS.unorderedList.test(text) ||
    MARKDOWN_PATTERNS.orderedList.test(text) ||
    MARKDOWN_PATTERNS.blockquote.test(text) ||
    MARKDOWN_PATTERNS.table.test(text);

  return matchCount >= 2 || hasStrongPattern;
}

/**
 * ClipboardEvent からプレーンテキストを取得
 * マークダウンテキストのペーストを優先するため、HTMLデータの有無を判断する
 */
function getPlainTextFromClipboard(event: ClipboardEvent): string | null {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return null;
  }

  const plainText = clipboardData.getData('text/plain');
  if (!plainText || plainText.trim().length === 0) {
    return null;
  }

  // HTML がある場合の判定
  const htmlData = clipboardData.getData('text/html');
  if (htmlData && htmlData.trim().length > 0) {
    // VS Code、ターミナル、テキストエディタからのコピーは HTML に <pre> や <code> が含まれる
    // これらはプレーンテキストを優先すべきケース
    const hasCodeElements = /<(pre|code)[^>]*>/i.test(htmlData);
    if (hasCodeElements) {
      return plainText;
    }

    // 単純な HTML ラッパー（meta, span, div, p, br のみ）の場合はプレーンテキストを優先
    const isSimpleHtml =
      /<(meta|span|div|p|br)[^>]*>/i.test(htmlData) && !/<(table|img|a|ul|ol|li|h[1-6])[^>]*>/i.test(htmlData);
    if (isSimpleHtml) {
      return plainText;
    }

    // リッチな HTML（Word, Google Docs 等）の場合は通常のペースト処理に任せる
    return null;
  }

  return plainText;
}

export default function MarkdownPastePlugin(): null {
  const [editor] = useLexicalComposerContext();

  const handlePaste = useCallback(
    (event: ClipboardEvent): boolean => {
      const plainText = getPlainTextFromClipboard(event);

      if (!plainText) {
        // プレーンテキストがない場合は通常のペースト処理に委譲
        return false;
      }

      // マークダウンかどうか判定
      if (!isLikelyMarkdown(plainText)) {
        // マークダウンでない場合は通常のペースト処理に委譲
        return false;
      }

      // マークダウンとして処理
      event.preventDefault();

      editor.update(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return;
        }

        // 選択範囲を削除（選択テキストを置換する場合）
        selection.removeText();

        // 現在のノードを取得
        const anchorNode = selection.anchor.getNode();

        // 空の段落ノードを作成してマークダウンを変換
        // $convertFromMarkdownString は対象ノードの子として変換結果を追加する
        const paragraphNode = $createParagraphNode();

        // マークダウンを Lexical ノードに変換
        // 改行コード正規化 (CRLF/CR → LF) + 2スペースインデントを4スペースに正規化
        const normalizedText = plainText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        $convertFromMarkdownString(
          normalizeListIndentation(normalizedText),
          PLAYGROUND_TRANSFORMERS,
          paragraphNode,
          true,
        );

        // 変換されたノードを現在の位置に挿入
        const children = paragraphNode.getChildren();

        if (children.length > 0) {
          // 現在のノードが空の段落の場合は置換、そうでなければ後に挿入
          const topLevelNode = anchorNode.getTopLevelElement();

          if (topLevelNode) {
            // 全ての変換されたノードを挿入
            let lastInserted: LexicalNode = topLevelNode;
            for (const child of children) {
              lastInserted.insertAfter(child);
              lastInserted = child;
            }

            // 元の空の段落を削除（必要に応じて）
            if (topLevelNode.getTextContent().trim() === '') {
              topLevelNode.remove();
            }

            // カーソルを最後に挿入したノードの末尾に移動
            lastInserted.selectEnd();
          } else {
            // フォールバック: 直接挿入
            selection.insertNodes(children);
          }
        }
      });

      return true;
    },
    [editor],
  );

  useEffect(() => {
    // PASTE_COMMAND を高優先度で登録し、マークダウンペーストを優先処理
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        return handlePaste(event);
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, handlePaste]);

  return null;
}
