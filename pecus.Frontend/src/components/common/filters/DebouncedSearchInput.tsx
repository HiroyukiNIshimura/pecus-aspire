'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface DebouncedSearchInputProps {
  /** 検索実行時のコールバック */
  onSearch: (query: string) => void;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** デバウンス遅延（ミリ秒） */
  debounceMs?: number;
  /** 初期値 */
  defaultValue?: string;
  /** 追加のCSSクラス */
  className?: string;
  /** inputのサイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** 検索アイコンを表示するか */
  showSearchIcon?: boolean;
  /** クリアボタンを表示するか */
  showClearButton?: boolean;
  /** ローディング中か */
  isLoading?: boolean;
  /** 入力を無効化するか */
  disabled?: boolean;
}

/**
 * デバウンス付き検索入力コンポーネント
 * - 日本語IME入力中は検索を実行しない
 * - 変換確定後またはデバウンス時間経過後に検索を実行
 */
export default function DebouncedSearchInput({
  onSearch,
  placeholder = '検索...',
  debounceMs = 300,
  defaultValue = '',
  className = '',
  size = 'sm',
  showSearchIcon = true,
  showClearButton = true,
  isLoading = false,
  disabled = false,
}: DebouncedSearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComposingRef = useRef(false);
  const onSearchRef = useRef(onSearch);

  // onSearchの最新値を参照するためのref
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const triggerSearch = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onSearchRef.current(query);
      }, debounceMs);
    },
    [debounceMs],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      // IME変換中は検索を実行しない
      if (!isComposingRef.current) {
        triggerSearch(newValue);
      }
    },
    [triggerSearch],
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      triggerSearch(e.currentTarget.value);
    },
    [triggerSearch],
  );

  const handleClear = useCallback(() => {
    setValue('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // 即座に空文字で検索を実行
    onSearchRef.current('');
  }, []);

  const inputSizeClass = {
    xs: 'input-xs',
    sm: 'input-sm',
    md: '',
    lg: 'input-lg',
  }[size];

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        className={`input input-bordered ${inputSizeClass} w-full ${showSearchIcon ? 'pl-9' : ''} ${showClearButton && value ? 'pr-9' : ''}`}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        autoComplete="nope"
      />
      {showSearchIcon && (
        <span
          className="icon-[mdi--magnify] absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50 pointer-events-none"
          aria-hidden="true"
        />
      )}
      {showClearButton && value && !isLoading && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
          title="クリア"
        >
          <span className="icon-[mdi--close-circle-outline] w-4 h-4" aria-hidden="true" />
        </button>
      )}
      {isLoading && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <span className="loading loading-spinner loading-sm" />
        </div>
      )}
    </div>
  );
}
