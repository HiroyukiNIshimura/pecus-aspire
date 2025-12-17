'use client';

import flatpickr from 'flatpickr';
import { Japanese } from 'flatpickr/dist/l10n/ja';
import { useEffect, useRef } from 'react';

interface DatePickerProps {
  /** 日付値（YYYY-MM-DD 形式） */
  value: string;
  /** 日付変更時のコールバック（YYYY-MM-DD 形式で返す） */
  onChange: (date: string) => void;
  /** フォーカスが外れた時のコールバック */
  onBlur?: () => void;
  /** カレンダーが閉じた時のコールバック（最終的な日付値を渡す） */
  onClose?: (date: string) => void;
  /** 無効状態 */
  disabled?: boolean;
  /** プレースホルダー */
  placeholder?: string;
  /** 追加の CSS クラス */
  className?: string;
  /** エラー状態 */
  error?: boolean;
}

/**
 * Flatpickr を使用した日本語対応デートピッカーコンポーネント
 */
export default function DatePicker({
  value,
  onChange,
  onBlur,
  onClose,
  disabled = false,
  placeholder = '日付を選択',
  className = '',
  error = false,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  // コールバックの最新値を保持するref
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onCloseRef = useRef(onClose);

  // コールバックが変更されたらrefを更新
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (inputRef.current && !fpRef.current) {
      fpRef.current = flatpickr(inputRef.current, {
        locale: Japanese,
        dateFormat: 'Y-m-d',
        defaultDate: value || undefined,
        allowInput: false,
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            // YYYY-MM-DD 形式で返す
            const year = selectedDates[0].getFullYear();
            const month = String(selectedDates[0].getMonth() + 1).padStart(2, '0');
            const day = String(selectedDates[0].getDate()).padStart(2, '0');
            onChangeRef.current(`${year}-${month}-${day}`);
          } else {
            onChangeRef.current('');
          }
        },
        onClose: (selectedDates) => {
          // カレンダーが閉じられた時の処理
          let dateStr = '';
          if (selectedDates.length > 0) {
            const year = selectedDates[0].getFullYear();
            const month = String(selectedDates[0].getMonth() + 1).padStart(2, '0');
            const day = String(selectedDates[0].getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
          }
          onBlurRef.current?.();
          onCloseRef.current?.(dateStr);
        },
      });
    }

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, []);

  // 外部から value が変更された場合に同期
  useEffect(() => {
    if (fpRef.current) {
      fpRef.current.setDate(value || '', false);
    }
  }, [value]);

  // disabled 状態の同期
  useEffect(() => {
    if (fpRef.current && inputRef.current) {
      inputRef.current.disabled = disabled;
    }
  }, [disabled]);

  // 日付をクリアする
  const handleClear = () => {
    if (fpRef.current) {
      fpRef.current.clear();
    }
    onChangeRef.current('');
    onCloseRef.current?.('');
  };

  const showClearButton = value && !disabled;

  return (
    <div className="relative inline-flex w-full">
      <input
        ref={inputRef}
        type="text"
        className={`input input-bordered w-full ${showClearButton ? 'pr-10' : ''} ${error ? 'input-error' : ''} ${className}`}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
      />
      {showClearButton && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 btn btn-xs btn-circle"
          onClick={handleClear}
          aria-label="日付をクリア"
        >
          <span className="icon-[mdi--close] size-5" />
        </button>
      )}
    </div>
  );
}
