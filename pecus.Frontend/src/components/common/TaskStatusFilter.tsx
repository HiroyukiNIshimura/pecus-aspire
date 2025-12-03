'use client';

import { useId } from 'react';

/**
 * タスクのステータス
 */
export type TaskStatus = 'active' | 'completed' | 'discarded' | null;

/**
 * TaskStatusFilter コンポーネントのProps
 *
 * FlyonUI の filter コンポーネントを使用したタスクステータスフィルター
 * @see https://flyonui.com/docs/forms/filter/
 *
 * 選択肢は固定: 「すべて」「未完了」「完了」「破棄」
 * - 「すべて」は filter-reset として常に表示
 */
export interface TaskStatusFilterProps {
  /** フィルターのラベル（省略時は「ステータス」） */
  label?: string;
  /** 現在選択されている値。省略時は defaultValue が使用される */
  value?: TaskStatus;
  /** デフォルト値（省略時は null=すべて） */
  defaultValue?: TaskStatus;
  /** 値が変更された時のコールバック */
  onChange: (value: TaskStatus) => void;
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
const OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: null, label: 'すべて' },
  { value: 'active', label: '未完了' },
  { value: 'completed', label: '完了' },
  { value: 'discarded', label: '破棄' },
];

/**
 * TaskStatusFilter コンポーネント
 *
 * FlyonUI の filter コンポーネントを使用
 * タスクのステータスによるフィルタリングに特化
 *
 * @example
 * ```tsx
 * // 制御コンポーネントとして使用（value を指定）
 * <TaskStatusFilter
 *   value={taskStatus}
 *   onChange={setTaskStatus}
 * />
 *
 * // ラベルをカスタマイズ
 * <TaskStatusFilter
 *   label="タスク状態"
 *   value={taskStatus}
 *   onChange={setTaskStatus}
 * />
 * ```
 */
export default function TaskStatusFilter({
  label = 'ステータス',
  value,
  defaultValue = null,
  onChange,
  name,
  className = '',
  size = 'sm',
  disabled = false,
}: TaskStatusFilterProps) {
  // value が指定されていない場合は defaultValue を使用
  const currentValue = value !== undefined ? value : defaultValue;
  // ユニークなIDを生成（同じページに複数のフィルターがある場合の対応）
  const generatedId = useId();
  const filterName = name || `task-status-filter-${generatedId}`;

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
