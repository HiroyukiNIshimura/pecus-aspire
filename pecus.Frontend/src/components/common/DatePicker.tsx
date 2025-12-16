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
  disabled = false,
  placeholder = '日付を選択',
  className = '',
  error = false,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

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
            onChange(`${year}-${month}-${day}`);
          } else {
            onChange('');
          }
        },
        onClose: () => {
          // カレンダーが閉じられた時に onBlur を呼び出す
          onBlur?.();
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

  return (
    <input
      ref={inputRef}
      type="text"
      className={`input input-bordered ${error ? 'input-error' : ''} ${className}`}
      placeholder={placeholder}
      disabled={disabled}
      readOnly
    />
  );
}
