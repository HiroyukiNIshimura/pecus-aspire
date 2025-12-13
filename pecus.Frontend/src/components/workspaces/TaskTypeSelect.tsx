'use client';

import { useEffect, useMemo, useState } from 'react';

/** タスク種類の選択肢 */
export interface TaskTypeOption {
  id: number;
  code: string;
  name: string;
  icon?: string | null;
}

export interface TaskTypeSelectProps {
  id?: string;
  name?: string;
  /** タスク種類の選択肢（API から取得したマスタデータ） */
  taskTypes: TaskTypeOption[];
  /** 制御コンポーネント用の値（優先） - taskTypeId */
  value?: number | null;
  /** 非制御コンポーネント用の初期値 - taskTypeId */
  defaultValue?: number | '' | null;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  onChange?: (value: number | null) => void;
}

/**
 * タスク種類のアイコンパスを取得
 * Icon 値からハイフンを除去してファイル名と一致させる
 */
function getTaskTypeIconPath(icon: string | null | undefined): string | null {
  if (!icon) return null;
  const iconName = icon.replace(/-/g, '').toLowerCase();
  return `/icons/task/${iconName}.svg`;
}

/**
 * タスク種類選択セレクト（アイコン表示対応）
 * - option 内に SVG を表示
 * - 選択済み表示にも背景アイコンを表示
 * - value を指定すると制御コンポーネントとして動作
 */
export default function TaskTypeSelect({
  id = 'taskTypeId',
  name = 'taskTypeId',
  taskTypes,
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

  // 選択されているタスク種類を取得
  const selectedTaskType = useMemo(() => {
    const targetId = isControlled ? value : defaultValue;
    if (targetId === null || targetId === undefined || targetId === '') return null;
    const numericId = typeof targetId === 'string' ? Number.parseInt(targetId, 10) : targetId;
    if (Number.isNaN(numericId)) return null;
    return taskTypes.find((t) => t.id === numericId) ?? null;
  }, [isControlled, value, defaultValue, taskTypes]);

  const currentIcon = useMemo(() => {
    return selectedTaskType ? getTaskTypeIconPath(selectedTaskType.icon) : null;
  }, [selectedTaskType]);

  useEffect(() => {
    setSelectedIcon(currentIcon);
  }, [currentIcon]);

  return (
    <>
      <style jsx>{`
        .task-type-select {
          min-width: 180px;
          height: 38px;
          border-color: #a4a4a4;
          border-radius: 8px;
          align-items: center;
          padding: 8px;
        }
        .task-type-select :global(option) {
          padding: 8px;
          background-color: var(--color-base-200);
        }
        .task-type-select :global(option:hover) {
          background-color: var(--color-base-100);
        }
        .task-type-select :global(option img) {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          vertical-align: middle;
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
          const val = e.target.value;
          const taskTypeId = val ? Number.parseInt(val, 10) : null;
          const taskType = taskTypeId ? taskTypes.find((t) => t.id === taskTypeId) : null;
          const icon = taskType ? getTaskTypeIconPath(taskType.icon) : null;
          setSelectedIcon(icon);
          onChange?.(taskTypeId);
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
        {taskTypes.map((option) => (
          <option key={option.id} value={option.id}>
            {option.icon && (
              <img src={getTaskTypeIconPath(option.icon) || ''} alt="" className="w-4 h-4 inline-block mr-2" />
            )}
            {option.name}
          </option>
        ))}
      </select>
    </>
  );
}
