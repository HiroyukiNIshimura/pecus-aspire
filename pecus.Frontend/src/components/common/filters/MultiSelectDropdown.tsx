'use client';

import { useCallback } from 'react';

/**
 * ドロップダウンで選択可能なアイテムの型
 */
export interface SelectableItem {
  id: number;
  name: string;
}

/**
 * マルチセレクトドロップダウンのProps
 */
interface MultiSelectDropdownProps {
  /** ラベルテキスト */
  label: string;
  /** 選択可能なアイテム一覧 */
  items: SelectableItem[];
  /** 現在選択されているアイテムのID一覧 */
  selectedIds: number[];
  /** 選択状態が変更された時のコールバック */
  onSelectionChange: (selectedIds: number[]) => void;
  /** 無効状態 */
  disabled?: boolean;
  /** 未選択時のプレースホルダーテキスト */
  placeholder?: string;
  /** アイテムがない場合のテキスト */
  emptyMessage?: string;
  /** 選択バッジの色（Tailwind CSSのbadgeクラス） */
  badgeColor?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  /** 変更検知メッセージ（変更がある場合に表示） */
  changeMessage?: string;
  /** 初期表示時にドロップダウンを開いた状態にする */
  defaultOpen?: boolean;
}

/**
 * マルチセレクトドロップダウンコンポーネント
 *
 * 複数のアイテムを選択できるドロップダウンUI。
 * 選択されたアイテムはバッジとして表示され、個別に削除可能。
 *
 * @example
 * ```tsx
 * <MultiSelectDropdown
 *   label="スキル"
 *   items={availableSkills}
 *   selectedIds={selectedSkillIds}
 *   onSelectionChange={setSelectedSkillIds}
 *   placeholder="スキルを選択してください"
 *   emptyMessage="利用可能なスキルがありません"
 *   badgeColor="primary"
 *   changeMessage={skillsChanged ? "✓ スキルが変更されています" : undefined}
 * />
 * ```
 */
export default function MultiSelectDropdown({
  label,
  items,
  selectedIds,
  onSelectionChange,
  disabled = false,
  placeholder = '選択してください',
  emptyMessage = '利用可能なアイテムがありません',
  badgeColor = 'primary',
  changeMessage,
  defaultOpen = false,
}: MultiSelectDropdownProps) {
  /**
   * アイテムの選択状態をトグル
   */
  const toggleItem = useCallback(
    (itemId: number) => {
      if (selectedIds.includes(itemId)) {
        onSelectionChange(selectedIds.filter((id) => id !== itemId));
      } else {
        onSelectionChange([...selectedIds, itemId]);
      }
    },
    [selectedIds, onSelectionChange],
  );

  /**
   * バッジの色クラスを取得
   */
  const getBadgeClass = () => {
    const colorMap: Record<typeof badgeColor, string> = {
      primary: 'badge-primary',
      secondary: 'badge-secondary',
      accent: 'badge-accent',
      info: 'badge-info',
      success: 'badge-success',
      warning: 'badge-warning',
      error: 'badge-error',
    };
    return colorMap[badgeColor];
  };

  /**
   * 選択中のテキストを生成
   */
  const getSelectionText = () => {
    if (selectedIds.length === 0) {
      return placeholder;
    }
    return `${selectedIds.length} 個の${label}を選択中`;
  };

  return (
    <div className="form-control">
      <div className="label">
        <span className="label-text font-semibold text-base">{label}</span>
        <span className="label-text-alt">
          {selectedIds.length} / {items.length} 個選択中
        </span>
      </div>

      <details className="dropdown w-full group" open={defaultOpen}>
        <summary className={`btn btn-outline w-full justify-between ${disabled ? 'btn-disabled' : ''}`}>
          <span className={selectedIds.length === 0 ? 'text-base-content/50' : ''}>{getSelectionText()}</span>
          {/* シェブロンアイコン（開閉状態で回転） */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4 transition-transform duration-200 group-open:rotate-180"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </summary>
        <ul className="dropdown-content menu bg-base-100 rounded-box w-full p-2 shadow-lg border border-base-300 max-h-60 overflow-y-auto z-1">
          {items.length === 0 ? (
            <li className="text-center text-base-content/60 py-4">{emptyMessage}</li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <label
                  className="label cursor-pointer gap-3 hover:bg-base-200 rounded p-2"
                  htmlFor={`multi-select-item-${item.id}`}
                >
                  <input
                    id={`multi-select-item-${item.id}`}
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="checkbox checkbox-primary checkbox-sm"
                    disabled={disabled}
                  />
                  <span className="label-text flex-1">{item.name}</span>
                </label>
              </li>
            ))
          )}
        </ul>
      </details>

      {/* 選択されたアイテムのバッジ表示 */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedIds.map((itemId) => {
            const item = items.find((i) => i.id === itemId);
            return (
              <div key={itemId} className={`badge ${getBadgeClass()} gap-2`}>
                {item?.name || `ID: ${itemId}`}
                <button
                  type="button"
                  onClick={() => toggleItem(itemId)}
                  className="btn btn-xs no-animation"
                  aria-label={`${item?.name}を削除`}
                  disabled={disabled}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 変更検知メッセージ */}
      {changeMessage && (
        <div className="alert alert-soft alert-info mt-3">
          <span className="text-sm">{changeMessage}</span>
        </div>
      )}
    </div>
  );
}
