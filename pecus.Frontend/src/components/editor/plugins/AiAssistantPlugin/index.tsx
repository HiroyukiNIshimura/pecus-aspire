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
      // 現在のエディタ内容をMarkdownに変換（カーソル位置はドキュメント末尾として扱う）
      let markdownWithCursor = '';

      editor.getEditorState().read(() => {
        const markdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
        // カーソルマーカーを末尾に配置（AIに文脈を提供）
        markdownWithCursor = `${markdown}\n${CURSOR_MARKER}`;
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

          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            // 現在の選択範囲（カーソル位置）にテキストを直接挿入
            selection.insertRawText(textToInsert);
          } else {
            // 選択がない場合はドキュメント末尾に追加
            const currentMarkdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
            const newMarkdown = `${currentMarkdown}\n${textToInsert}`;

            const root = $getRoot();
            root.clear();
            $convertFromMarkdownString(newMarkdown, PLAYGROUND_TRANSFORMERS);
          }
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
