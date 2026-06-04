'use client';

import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';

export interface MentionCandidate {
  key: string;
  value: string;
  label: string;
}

interface ChatMessageInputProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  mentionCandidates?: MentionCandidate[];
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
  mentionCandidates = [],
}: ChatMessageInputProps) {
  const [content, setContent] = useState('');
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // IME 変換中かどうかを追跡（日本語入力対応）
  const isComposingRef = useRef(false);

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

  // IME 変換開始
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  // IME 変換終了
  const handleCompositionEnd = () => {
    // 一部のブラウザでは compositionend 後に keydown が発火するため、
    // 少し遅延させてフラグをリセット
    setTimeout(() => {
      isComposingRef.current = false;
    }, 10);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // IME 変換中（日本語変換中など）は無視
    // useRef で管理する方が e.nativeEvent.isComposing より確実
    if (isComposingRef.current || e.nativeEvent.isComposing) return;

    if (isMentionOpen && filteredMentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredMentionCandidates.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev === 0 ? filteredMentionCandidates.length - 1 : prev - 1));
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeMentionPopup();
        return;
      }

      if ((e.key === 'Enter' || e.key === 'Tab') && mentionStartIndex !== null) {
        e.preventDefault();
        applyMention(filteredMentionCandidates[selectedMentionIndex].value);
        return;
      }
    }

    // Enter で送信（Shift+Enter は改行）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMentionOpen && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      return;
    }

    updateMentionState(content, e.currentTarget.selectionStart);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    handleTyping();
    updateMentionState(value, e.target.selectionStart);
  };

  const canSend = content.trim().length > 0 && !disabled;

  const normalizedQuery = mentionQuery.trim().toLowerCase();

  const filteredMentionCandidates = mentionCandidates
    .map((candidate) => {
      const normalizedValue = candidate.value.toLowerCase();
      const normalizedLabel = candidate.label.toLowerCase();

      let rank = 99;
      if (normalizedQuery.length === 0) {
        rank = 3;
      } else if (normalizedValue === normalizedQuery) {
        rank = 0; // 完全一致
      } else if (normalizedValue.startsWith(normalizedQuery)) {
        rank = 1; // 前方一致
      } else if (normalizedValue.includes(normalizedQuery) || normalizedLabel.includes(normalizedQuery)) {
        rank = 2; // 部分一致
      }

      return {
        candidate,
        rank,
      };
    })
    .filter((entry) => entry.rank < 99)
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }

      return a.candidate.label.localeCompare(b.candidate.label, 'ja');
    })
    .map((entry) => entry.candidate)
    .slice(0, 8);

  const closeMentionPopup = () => {
    setIsMentionOpen(false);
    setMentionQuery('');
    setMentionStartIndex(null);
    setSelectedMentionIndex(0);
  };

  const updateMentionState = (value: string, caretPosition: number | null) => {
    if (caretPosition === null || mentionCandidates.length === 0) {
      closeMentionPopup();
      return;
    }

    const beforeCaret = value.slice(0, caretPosition);
    const atIndex = beforeCaret.lastIndexOf('@');

    if (atIndex === -1) {
      closeMentionPopup();
      return;
    }

    const hasValidBoundary = atIndex === 0 || /\s/.test(beforeCaret[atIndex - 1] ?? '');
    if (!hasValidBoundary) {
      closeMentionPopup();
      return;
    }

    const query = beforeCaret.slice(atIndex + 1);
    if (/\s/.test(query)) {
      closeMentionPopup();
      return;
    }

    setMentionStartIndex(atIndex);
    setMentionQuery(query);
    setSelectedMentionIndex(0);
    setIsMentionOpen(true);
  };

  const applyMention = (displayName: string) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex === null) {
      return;
    }

    const selectionStart = textarea.selectionStart ?? content.length;
    const mentionText = `@${displayName} `;
    const nextContent = `${content.slice(0, mentionStartIndex)}${mentionText}${content.slice(selectionStart)}`;

    setContent(nextContent);
    handleTyping();
    closeMentionPopup();

    requestAnimationFrame(() => {
      const nextCaretPosition = mentionStartIndex + mentionText.length;
      textarea.focus();
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative border-t border-base-300 p-3 pb-safe bg-base-100 shrink-0">
      {isMentionOpen && filteredMentionCandidates.length > 0 && (
        <div className="absolute left-3 bottom-16 w-80 max-w-full sm:w-96 rounded-box border border-base-300 bg-base-100 shadow-lg z-20">
          <ul className="max-h-52 overflow-y-auto p-1">
            {filteredMentionCandidates.map((candidate, index) => (
              <li key={candidate.key}>
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm w-full justify-start ${index === selectedMentionIndex ? 'btn-active' : ''}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyMention(candidate.value);
                  }}
                >
                  <span className="truncate">@{candidate.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* 入力欄 */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onClick={(event) => updateMentionState(content, event.currentTarget.selectionStart)}
          onKeyUp={handleKeyUp}
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
