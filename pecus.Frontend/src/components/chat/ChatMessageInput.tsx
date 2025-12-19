'use client';

import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';

interface ChatMessageInputProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * メッセージ入力コンポーネント
 * - Enter で送信（Shift+Enter で改行）
 * - 入力中の通知（onTyping）
 * - 自動リサイズ textarea
 */
export default function ChatMessageInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'メッセージを入力...',
}: ChatMessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 入力中の通知（デバウンス）
  const handleTyping = () => {
    if (!onTyping) return;

    // 前回のタイムアウトをクリア
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 入力中を通知
    onTyping();

    // 2秒後に再度通知可能にする
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // textarea の高さを自動調整
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || disabled) return;

    onSend(trimmedContent);
    setContent('');

    // 高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // IME 入力中（日本語変換中など）は無視
    if (e.nativeEvent.isComposing) return;

    // Enter で送信（Shift+Enter は改行）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    handleTyping();
  };

  const canSend = content.trim().length > 0 && !disabled;

  return (
    <form onSubmit={handleSubmit} className="border-t border-base-300 p-3 bg-base-100">
      <div className="flex items-end gap-2">
        {/* TODO: ファイル添付ボタン（Phase 3） */}
        {/* <button type="button" className="btn btn-ghost btn-sm btn-circle flex-shrink-0">
          <span className="icon-[tabler--paperclip] size-5" aria-hidden="true" />
        </button> */}

        {/* 入力欄 */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="textarea textarea-bordered flex-1 min-h-10 max-h-30 resize-none py-2"
          aria-label="メッセージ入力"
        />

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={!canSend}
          className="btn btn-primary btn-sm btn-circle flex-shrink-0"
          aria-label="送信"
        >
          <span className="icon-[tabler--send] size-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
