'use client';

/** Boolean フィルターの選択肢 */
export interface BooleanFilterOption {
  value: boolean | null;
  label: string;
}

/** デフォルトの選択肢 */
export const defaultBooleanFilterOptions: BooleanFilterOption[] = [
  { value: null, label: 'すべて' },
  { value: true, label: 'はい' },
  { value: false, label: 'いいえ' },
];

/** BooleanFilterGroup の Props */
export interface BooleanFilterGroupProps {
  /** ラベル */
  label: string;
  /** input の name 属性（ラジオボタングループの識別子） */
  name: string;
  /** 現在の値 */
  value: boolean | null | undefined;
  /** 値変更時のコールバック */
  onChange: (value: boolean | null) => void;
  /** カスタム選択肢（省略時はデフォルトの「すべて/はい/いいえ」） */
  options?: BooleanFilterOption[];
  /** ラベルを非表示にする */
  hideLabel?: boolean;
}

/**
 * Boolean フィルターグループコンポーネント（FlyonUI filter スタイル）
 *
 * 3択のラジオボタンで boolean | null を選択できるフィルター
 *
 * @example
 * ```tsx
 * <BooleanFilterGroup
 *   label="下書き"
 *   name="filter-draft"
 *   value={filters.isDraft}
 *   onChange={(value) => setFilters({ ...filters, isDraft: value })}
 * />
 * ```
 *
 * @example カスタム選択肢
 * ```tsx
 * <BooleanFilterGroup
 *   label="公開状態"
 *   name="filter-published"
 *   value={isPublished}
 *   onChange={setIsPublished}
 *   options={[
 *     { value: null, label: '全て' },
 *     { value: true, label: '公開中' },
 *     { value: false, label: '非公開' },
 *   ]}
 * />
 * ```
 */
export default function BooleanFilterGroup({
  label,
  name,
  value,
  onChange,
  options = defaultBooleanFilterOptions,
  hideLabel = false,
}: BooleanFilterGroupProps) {
  const currentValue = value === undefined ? null : value;

  return (
    <div className="form-control">
      {!hideLabel && (
        <div className="label">
          <span className="label-text font-semibold">{label}</span>
        </div>
      )}
      <div className="filter" role="radiogroup" aria-label={label}>
        {options.map((option, index) => {
          const isChecked = currentValue === option.value;
          const inputId = `${name}-${index}`;
          const isResetOption = index === 0;

          return (
            <input
              key={inputId}
              id={inputId}
              type="radio"
              name={name}
              className={`btn btn-xs ${isResetOption ? 'filter-reset' : ''}`}
              aria-label={option.label}
              checked={isChecked}
              onChange={() => onChange(option.value)}
            />
          );
        })}
      </div>
    </div>
  );
}
