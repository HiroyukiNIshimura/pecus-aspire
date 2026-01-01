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
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
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
      let markdownWithCursor = '';

      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          markdownWithCursor = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
          return;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();
        const anchorOffset = anchor.offset;

        const markdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
        const lines = markdown.split('\n');

        let insertPosition = 0;
        let found = false;

        const textContent = anchorNode.getTextContent();
        const beforeCursor = textContent.slice(0, anchorOffset);

        for (let i = 0; i < lines.length && !found; i++) {
          const line = lines[i];

          if (line.includes(beforeCursor) || (beforeCursor === '' && line === '')) {
            const lineStart = markdown.indexOf(line, insertPosition);
            if (lineStart !== -1) {
              const posInLine = beforeCursor ? line.indexOf(beforeCursor) + beforeCursor.length : 0;
              insertPosition = lineStart + posInLine;
              found = true;
            }
          }

          if (!found) {
            insertPosition += line.length + 1;
          }
        }

        if (!found) {
          insertPosition = markdown.length;
        }

        markdownWithCursor = markdown.slice(0, insertPosition) + CURSOR_MARKER + markdown.slice(insertPosition);
      });

      const result = await generateAiText({
        markdown: markdownWithCursor,
        cursorMarker: CURSOR_MARKER,
        userPrompt,
      });

      editor.update(
        () => {
          let textToInsert: string;
          if (result.success && result.data?.generatedText) {
            textToInsert = result.data.generatedText;
          } else {
            textToInsert = ERROR_MESSAGE;
          }

          // 現在のコンテンツをMarkdownとして取得
          const currentMarkdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);

          // 現在のコンテンツと生成されたテキストを結合
          const combinedMarkdown = currentMarkdown.trim()
            ? `${currentMarkdown.trim()}\n\n${textToInsert}`
            : textToInsert;

          // ルートをクリアして結合したマークダウンを変換
          const root = $getRoot();
          root.clear();
          $convertFromMarkdownString(combinedMarkdown, PLAYGROUND_TRANSFORMERS);

          // 最後のノードを選択
          const newLastChild = root.getLastChild();
          newLastChild?.selectEnd();
        },
        { skipTransforms: true },
      );

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
