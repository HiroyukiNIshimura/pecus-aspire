'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TaskType } from '@/connectors/api/pecus';

/** タスクタイプの選択肢 */
const taskTypeOptions: { value: TaskType; label: string }[] = [
  { value: 'Bug', label: 'バグ修正' },
  { value: 'Feature', label: '機能追加' },
  { value: 'Documentation', label: 'ドキュメント' },
  { value: 'Review', label: 'レビュー' },
  { value: 'Testing', label: 'テスト' },
  { value: 'Refactoring', label: 'リファクタリング' },
  { value: 'Research', label: '調査' },
  { value: 'Meeting', label: '会議' },
  { value: 'BusinessNegotiation', label: '商談' },
  { value: 'RequirementsConfirmation', label: '要件確認' },
  { value: 'Other', label: 'その他' },
];

export interface TaskTypeSelectProps {
  id?: string;
  name?: string;
  /** 制御コンポーネント用の値（優先） */
  value?: TaskType | null;
  /** 非制御コンポーネント用の初期値 */
  defaultValue?: TaskType | '' | null;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  onChange?: (value: TaskType | null) => void;
}

/**
 * タスクタイプのアイコンパスを取得
 */
function getTaskTypeIconPath(taskType: TaskType): string {
  return `/icons/task/${taskType.toLowerCase()}.svg`;
}

/**
 * タスクタイプ選択セレクト（アイコン表示対応）
 * - option 内に SVG を表示
 * - 選択済み表示にも背景アイコンを表示
 * - value を指定すると制御コンポーネントとして動作
 */
export default function TaskTypeSelect({
  id = 'taskType',
  name = 'taskType',
  value,
  defaultValue = '',
  disabled,
  error,
  className,
  onChange,
}: TaskTypeSelectProps) {
  // value が指定されている場合は制御コンポーネントとして動作
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : undefined;

  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // 制御コンポーネントの場合は value から、非制御の場合は defaultValue からアイコンを取得
  const iconValue = isControlled
    ? value
    : typeof defaultValue === 'string' && defaultValue !== ''
      ? defaultValue
      : null;

  const currentIcon = useMemo(() => {
    return iconValue ? getTaskTypeIconPath(iconValue) : null;
  }, [iconValue]);

  useEffect(() => {
    setSelectedIcon(currentIcon);
  }, [currentIcon]);

  return (
    <>
      <style jsx>{`
        :global(.task-type-select) {
          appearance: base-select;
          min-width: 180px;
          height: 38px;
          border-color: #a4a4a4;
          border-radius: 8px;
          align-items: center;
          padding: 8px;
        }
        :global(.task-type-select option) {
          padding: 8px;
          background-color: var(--color-base-200);
        }
        :global(.task-type-select option:hover) {
          background-color: var(--color-base-100);
        }
        :global(.task-type-select option img) {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          vertical-align: middle;
        }
        :global(::picker(select)) {
          appearance: base-select;
          border-color: #a4a4a4;
          border-radius: 8px;
        }
        :global(::picker(select) option) {
          display: flex;
          align-items: center;
          padding: 8px 12px;
        }
        :global(::picker(select) option:hover) {
          background-color: var(--color-base-100);
        }
      `}</style>

      <select
        id={id}
        name={name}
        value={isControlled ? (currentValue ?? '') : undefined}
        defaultValue={isControlled ? undefined : (defaultValue ?? '')}
        className={`select select-bordered task-type-select ${error ? 'select-error' : ''} ${className ?? ''}`}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value as TaskType | '';
          const taskType = val || null;
          const icon = taskType ? getTaskTypeIconPath(taskType) : null;
          setSelectedIcon(icon);
          onChange?.(taskType);
        }}
        style={{
          backgroundImage: selectedIcon ? `url(${selectedIcon})` : 'none',
          backgroundPosition: '12px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '20px 20px',
          paddingLeft: selectedIcon ? '40px' : undefined,
        }}
      >
        <option value="">選択してください</option>
        {taskTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            <img src={getTaskTypeIconPath(option.value)} alt="" className="w-4 h-4 inline-block mr-2" />
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
