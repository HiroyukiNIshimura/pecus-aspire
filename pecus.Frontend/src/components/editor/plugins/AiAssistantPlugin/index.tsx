/**
 * AiAssistantPlugin
 *
 * エディタ内でAIアシスタントを起動し、カーソル位置に最適なテキストを生成・挿入するプラグイン。
 *
 * 機能:
 * - ComponentPickerPlugin（/メニュー）から起動
 * - インライン入力フィールドでユーザーの指示を受け取る
 * - 現在のエディタ内容をMarkdownに変換し、カーソル位置マーカーを挿入
 * - Server Action経由でAI APIを呼び出し、生成されたテキストを挿入
 */
'use client';

import { PLAYGROUND_TRANSFORMERS } from '@coati/editor';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  type LexicalNode,
} from 'lexical';
import type { JSX } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { generateAiText } from '@/actions/aiAssistant';
import './index.css';

const CURSOR_MARKER = '{AI_CURSOR}';
const ERROR_MESSAGE = 'ご希望の文章を生成できませんでした。';

/**
 * AIアシスタントを起動するコマンド
 */
export const INSERT_AI_ASSISTANT_COMMAND: LexicalCommand<void> = createCommand('INSERT_AI_ASSISTANT_COMMAND');

/**
 * AIアシスタント入力ダイアログコンポーネント
 */
function AiAssistantInputDialog({
  anchorRect,
  onSubmit,
  onClose,
}: {
  anchorRect: DOMRect | null;
  onSubmit: (userPrompt: string) => Promise<void>;
  onClose: () => void;
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!anchorRect || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const dialogWidth = 400;
    const dialogHeight = 50;
    const padding = 10;

    let left = anchorRect.left;
    let top = anchorRect.bottom + padding;

    if (left + dialogWidth > window.innerWidth) {
      left = window.innerWidth - dialogWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    if (top + dialogHeight > window.innerHeight) {
      top = anchorRect.top - dialogHeight - padding;
    }

    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
  }, [anchorRect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await onSubmit(input.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div ref={dialogRef} className="ai-assistant-dialog">
      <div className="ai-assistant-dialog-content">
        <span className="ai-assistant-icon" aria-hidden="true">
          {isLoading ? (
            <i className="iconify lucide--loader-2 animate-spin" />
          ) : (
            <i className="iconify lucide--sparkles" />
          )}
        </span>
        {isLoading ? (
          <span className="ai-assistant-loading-text">AIが文章を生成しています...</span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="ai-assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="AIに何を書いてほしいですか？"
            aria-label="AI生成の指示を入力"
          />
        )}
      </div>
    </div>
  );
}

export default function AiAssistantPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_AI_ASSISTANT_COMMAND,
        () => {
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setAnchorRect(rect);
          }
          setIsOpen(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  const handleSubmit = useCallback(
    async (userPrompt: string) => {
      // 現在のエディタ内容をMarkdownとして取得（AIに文脈を伝える）
      let currentMarkdown = '';
      editor.getEditorState().read(() => {
        currentMarkdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
      });

      // AI用のコンテキストマークダウンを作成（カーソル位置を末尾として伝える）
      const markdownForAi = `${currentMarkdown}\n${CURSOR_MARKER}`;

      const result = await generateAiText({
        markdown: markdownForAi,
        cursorMarker: CURSOR_MARKER,
        userPrompt,
      });

      // 生成テキストを取得
      let textToInsert: string;
      if (result.success && result.data?.generatedText) {
        textToInsert = result.data.generatedText;
      } else {
        textToInsert = ERROR_MESSAGE;
      }

      // MarkdownPastePluginと同様の方式で挿入
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
        const paragraphNode = $createParagraphNode();

        // マークダウンを Lexical ノードに変換
        $convertFromMarkdownString(textToInsert, PLAYGROUND_TRANSFORMERS, paragraphNode, true);

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

      setIsOpen(false);
      setAnchorRect(null);
    },
    [editor],
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setAnchorRect(null);
    editor.focus();
  }, [editor]);

  return (
    <>
      {isOpen &&
        createPortal(
          <AiAssistantInputDialog anchorRect={anchorRect} onSubmit={handleSubmit} onClose={handleClose} />,
          document.body,
        )}
    </>
  );
}
