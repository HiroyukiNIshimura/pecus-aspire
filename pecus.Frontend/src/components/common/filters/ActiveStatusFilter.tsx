'use client';

import { useId } from 'react';

/**
 * ActiveStatusFilter コンポーネントのProps
 *
 * FlyonUI の filter コンポーネントを使用した有効/無効フィルター
 * @see https://flyonui.com/docs/forms/filter/
 *
 * 選択肢は固定: 「すべて」「有効」「無効」
 * - 「すべて」は filter-reset として常に表示
 * - 「有効」「無効」は選択時のみ表示
 */
export interface ActiveStatusFilterProps {
  /** フィルターのラベル（省略時は「ステータス」） */
  label?: string;
  /** 現在選択されている値（true=有効, false=無効, null=すべて）。省略時は defaultValue が使用される */
  value?: boolean | null;
  /** デフォルト値（省略時は null=すべて） */
  defaultValue?: boolean | null;
  /** 値が変更された時のコールバック */
  onChange: (value: boolean | null) => void;
  /** フィルターグループの名前（同じ名前のラジオボタンはグループ化される） */
  name?: string;
  /** 追加のCSSクラス */
  className?: string;
  /** ボタンのサイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** 無効状態 */
  disabled?: boolean;
}

/** 固定の選択肢 */
const OPTIONS: { value: boolean | null; label: string }[] = [
  { value: null, label: 'すべて' },
  { value: true, label: '有効' },
  { value: false, label: '無効' },
];

/**
 * ActiveStatusFilter コンポーネント
 *
 * FlyonUI の filter コンポーネントを使用
 * エンティティの IsActive プロパティによるフィルタリングに特化
 *
 * @example
 * ```tsx
 * // 制御コンポーネントとして使用（value を指定）
 * <ActiveStatusFilter
 *   value={filterIsActive}
 *   onChange={setFilterIsActive}
 * />
 *
 * // デフォルト値を指定（value 省略時）
 * <ActiveStatusFilter
 *   defaultValue={true}
 *   onChange={setFilterIsActive}
 * />
 *
 * // ラベルをカスタマイズ
 * <ActiveStatusFilter
 *   label="表示状態"
 *   value={filterIsActive}
 *   onChange={setFilterIsActive}
 * />
 * ```
 */
export default function ActiveStatusFilter({
  label = 'ステータス',
  value,
  defaultValue = null,
  onChange,
  name,
  className = '',
  size = 'sm',
  disabled = false,
}: ActiveStatusFilterProps) {
  // value が指定されていない場合は defaultValue を使用
  const currentValue = value !== undefined ? value : defaultValue;
  // ユニークなIDを生成（同じページに複数のフィルターがある場合の対応）
  const generatedId = useId();
  const filterName = name || `active-status-filter-${generatedId}`;

  const sizeClass = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }[size];

  return (
    <div className={`form-control ${className}`}>
      {label && (
        <div className="label">
          <span className="label-text">{label}</span>
        </div>
      )}
      <div className="filter" role="radiogroup" aria-label={label}>
        {OPTIONS.map((option, index) => {
          const isChecked = currentValue === option.value;
          const inputId = `${filterName}-${index}`;
          // 最初の選択肢は filter-reset（常に表示されるリセットボタン）
          const isResetOption = index === 0;

          return (
            <input
              key={inputId}
              id={inputId}
              type="radio"
              name={filterName}
              className={`btn ${sizeClass} ${isResetOption ? 'filter-reset' : ''}`}
              aria-label={option.label}
              checked={isChecked}
              onChange={() => onChange(option.value)}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}
