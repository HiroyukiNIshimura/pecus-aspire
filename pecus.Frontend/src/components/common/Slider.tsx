'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * スライダーコンポーネントのProps
 */
interface SliderProps {
  /** スライダーの最小値 */
  min: number;
  /** スライダーの最大値 */
  max: number;
  /** スライダーのステップ値 */
  step: number;
  /** 初期値（valueとは独立） */
  defaultValue: number;
  /** 現在の値（制御コンポーネントとして使用する場合） */
  value?: number;
  /** 値が変更された時のコールバック */
  onChange?: (value: number) => void;
  /** ラベルテキスト */
  label?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** スライダーのクラス名（カスタマイズ用） */
  className?: string;
  /** 値を表示するかどうか */
  showValue?: boolean;
  /** 値の表示フォーマット関数 */
  valueFormatter?: (value: number) => string;
  /** aria-label（アクセシビリティ用） */
  ariaLabel?: string;
}

/**
 * 共通スライダーコンポーネント
 *
 * FlyonUIのデザインに準拠したスライダー。
 * 制御コンポーネントと非制御コンポーネントの両方に対応。
 *
 * @example
 * ```tsx
 * // 非制御コンポーネントとして使用
 * <Slider
 *   min={0}
 *   max={100}
 *   step={1}
 *   defaultValue={50}
 *   label="音量"
 *   showValue
 *   onChange={(value) => console.log(value)}
 * />
 *
 * // 制御コンポーネントとして使用
 * <Slider
 *   min={0}
 *   max={10}
 *   step={0.5}
 *   defaultValue={5}
 *   value={sliderValue}
 *   onChange={setSliderValue}
 *   label="評価"
 *   valueFormatter={(v) => `${v} / 10`}
 * />
 * ```
 */
export function Slider({
  min,
  max,
  step,
  defaultValue,
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  showValue = false,
  valueFormatter,
  ariaLabel,
}: SliderProps) {
  // 内部状態（非制御の場合に使用）
  const [internalValue, setInternalValue] = useState(defaultValue);

  // 実際に表示する値（制御 or 非制御）
  const currentValue = value !== undefined ? value : internalValue;

  // defaultValueの範囲チェック
  useEffect(() => {
    if (defaultValue < min || defaultValue > max) {
      console.warn(`Slider: defaultValue (${defaultValue}) is out of range [${min}, ${max}]`);
    }
  }, [defaultValue, min, max]);

  // 値の変更ハンドラー
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number.parseFloat(event.target.value);

      // 非制御の場合は内部状態を更新
      if (value === undefined) {
        setInternalValue(newValue);
      }

      // コールバックがあれば実行
      onChange?.(newValue);
    },
    [value, onChange],
  );

  // 値のフォーマット
  const formatValue = useCallback(
    (val: number): string => {
      if (valueFormatter) {
        return valueFormatter(val);
      }
      return val.toString();
    },
    [valueFormatter],
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* ラベルと値の表示 */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={ariaLabel || label} className="text-sm font-medium">
              {label}
            </label>
          )}
          {showValue && <span className="text-sm font-semibold text-primary">{formatValue(currentValue)}</span>}
        </div>
      )}

      {/* スライダー本体 */}
      <input
        id={ariaLabel || label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className="range range-primary"
        aria-label={ariaLabel || label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
      />
    </div>
  );
}
