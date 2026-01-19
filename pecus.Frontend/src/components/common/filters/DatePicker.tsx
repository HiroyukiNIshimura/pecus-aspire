'use client';

import flatpickr from 'flatpickr';
import { Japanese } from 'flatpickr/dist/l10n/ja';
import { useEffect, useRef } from 'react';

type DatePickerMode = 'date' | 'datetime' | 'time';

interface DatePickerProps {
  /**
   * 日付/時刻値
   * - mode='date': YYYY-MM-DD 形式
   * - mode='datetime': YYYY-MM-DDTHH:mm 形式
   * - mode='time': HH:mm 形式
   */
  value: string;
  /**
   * 値変更時のコールバック
   * - mode='date': YYYY-MM-DD 形式で返す
   * - mode='datetime': YYYY-MM-DDTHH:mm 形式で返す
   * - mode='time': HH:mm 形式で返す
   */
  onChange: (value: string) => void;
  /** フォーカスが外れた時のコールバック */
  onBlur?: () => void;
  /** カレンダーが閉じた時のコールバック */
  onClose?: (value: string) => void;
  /** ピッカーのモード */
  mode?: DatePickerMode;
  /** 無効状態 */
  disabled?: boolean;
  /** プレースホルダー */
  placeholder?: string;
  /** 追加の CSS クラス */
  className?: string;
  /** エラー状態 */
  error?: boolean;
  /** 分の刻み（デフォルト: 5分） */
  minuteIncrement?: number;
}

/**
 * 日付フォーマット設定
 */
const getFormatConfig = (mode: DatePickerMode) => {
  switch (mode) {
    case 'datetime':
      return {
        dateFormat: 'Y-m-d H:i',
        enableTime: true,
        noCalendar: false,
        time_24hr: true,
      };
    case 'time':
      return {
        dateFormat: 'H:i',
        enableTime: true,
        noCalendar: true,
        time_24hr: true,
      };
    default:
      return {
        dateFormat: 'Y-m-d',
        enableTime: false,
        noCalendar: false,
        time_24hr: false,
      };
  }
};

/**
 * Date オブジェクトを指定形式の文字列に変換
 */
const formatDate = (date: Date, mode: DatePickerMode): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  switch (mode) {
    case 'datetime':
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    case 'time':
      return `${hours}:${minutes}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * 文字列値を flatpickr が理解できる形式に変換
 */
const parseValueForFlatpickr = (value: string, mode: DatePickerMode): string | undefined => {
  if (!value) return undefined;

  switch (mode) {
    case 'datetime':
      // YYYY-MM-DDTHH:mm → YYYY-MM-DD HH:mm
      return value.replace('T', ' ');
    case 'time':
      // HH:mm → 今日の日付 + 時刻
      return value;
    default:
      return value;
  }
};

/**
 * プレースホルダーのデフォルト値
 */
const getDefaultPlaceholder = (mode: DatePickerMode): string => {
  switch (mode) {
    case 'datetime':
      return '日時を選択';
    case 'time':
      return '時刻を選択';
    default:
      return '日付を選択';
  }
};

/**
 * Flatpickr を使用した日本語対応デートピッカーコンポーネント
 *
 * @example
 * // 日付のみ（デフォルト）
 * <DatePicker value={date} onChange={setDate} />
 *
 * // 日時
 * <DatePicker mode="datetime" value={datetime} onChange={setDatetime} />
 *
 * // 時刻のみ
 * <DatePicker mode="time" value={time} onChange={setTime} />
 */
export default function DatePicker({
  value,
  onChange,
  onBlur,
  onClose,
  mode = 'date',
  disabled = false,
  placeholder,
  className = '',
  error = false,
  minuteIncrement = 5,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  // コールバックの最新値を保持するref
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onCloseRef = useRef(onClose);
  const modeRef = useRef(mode);

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
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (inputRef.current && !fpRef.current) {
      const formatConfig = getFormatConfig(mode);

      fpRef.current = flatpickr(inputRef.current, {
        locale: Japanese,
        ...formatConfig,
        minuteIncrement,
        defaultDate: parseValueForFlatpickr(value, mode),
        allowInput: false,
        static: true, // カレンダーをinput直下に配置（スクロール追従）
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            onChangeRef.current(formatDate(selectedDates[0], modeRef.current));
          } else {
            onChangeRef.current('');
          }
        },
        onClose: (selectedDates) => {
          let valueStr = '';
          if (selectedDates.length > 0) {
            valueStr = formatDate(selectedDates[0], modeRef.current);
          }
          onBlurRef.current?.();
          onCloseRef.current?.(valueStr);
        },
      });
    }

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [mode, minuteIncrement]);

  // 外部から value が変更された場合に同期
  useEffect(() => {
    if (fpRef.current) {
      const parsedValue = parseValueForFlatpickr(value, mode);
      fpRef.current.setDate(parsedValue || '', false);
    }
  }, [value, mode]);

  // disabled 状態の同期
  useEffect(() => {
    if (fpRef.current && inputRef.current) {
      inputRef.current.disabled = disabled;
    }
  }, [disabled]);

  // 値をクリアする
  const handleClear = () => {
    if (fpRef.current) {
      fpRef.current.clear();
    }
    onChangeRef.current('');
    onCloseRef.current?.('');
  };

  const showClearButton = value && !disabled;
  const effectivePlaceholder = placeholder ?? getDefaultPlaceholder(mode);

  return (
    <div className="relative w-full [&>.flatpickr-wrapper]:w-full [&>.flatpickr-wrapper]:block">
      <input
        ref={inputRef}
        type="text"
        className={`input input-bordered w-full ${showClearButton ? 'pr-10' : ''} ${error ? 'input-error' : ''} ${className}`}
        placeholder={effectivePlaceholder}
        disabled={disabled}
        readOnly
      />
      {showClearButton && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 btn btn-xs btn-secondary btn-circle z-10"
          onClick={handleClear}
          aria-label="クリア"
        >
          <span className="icon-[mdi--close] size-5" />
        </button>
      )}
    </div>
  );
}
