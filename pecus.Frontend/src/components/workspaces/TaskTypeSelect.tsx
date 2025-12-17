'use client';

import { useMemo } from 'react';
import Select, { components, type OptionProps, type SingleValue, type StylesConfig } from 'react-select';

/** タスク種類の選択肢 */
export interface TaskTypeOption {
  id: number;
  code: string;
  name: string;
  icon?: string | null;
}

/** react-select 用のオプション型 */
interface SelectOption {
  value: number;
  label: string;
  icon: string | null;
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

/** オプションラベルのカスタムレンダリング（アイコン付き） */
const formatOptionLabel = (option: SelectOption) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {option.icon && <img src={option.icon} alt="" style={{ width: '20px', height: '20px' }} />}
    <span>{option.label}</span>
  </div>
);

/** カスタム Option コンポーネント */
const CustomOption = (props: OptionProps<SelectOption, false>) => (
  <components.Option {...props}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {props.data.icon && <img src={props.data.icon} alt="" style={{ width: '20px', height: '20px' }} />}
      <span>{props.data.label}</span>
    </div>
  </components.Option>
);

/**
 * タスク種類選択セレクト（react-select ベース・アイコン表示対応）
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
  const isControlled = value !== undefined;

  const options: SelectOption[] = useMemo(
    () =>
      taskTypes.map((t) => ({
        value: t.id,
        label: t.name,
        icon: getTaskTypeIconPath(t.icon),
      })),
    [taskTypes],
  );

  const selectedOption = useMemo(() => {
    if (isControlled) {
      return options.find((o) => o.value === value) ?? null;
    }
    return null;
  }, [options, value, isControlled]);

  const defaultOption = useMemo(() => {
    if (!isControlled && typeof defaultValue === 'number') {
      return options.find((o) => o.value === defaultValue) ?? null;
    }
    return null;
  }, [options, defaultValue, isControlled]);

  // スタイル定義（portal内でも動作するようインラインスタイルで完全制御）
  // FlyonUI の CSS 変数を使用: var(--color-base-100), var(--color-base-content) 等
  const customStyles: StylesConfig<SelectOption, false> = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minWidth: '180px',
        minHeight: '38px',
        borderRadius: '8px',
        borderColor: error
          ? 'var(--color-error)'
          : state.isFocused
            ? 'var(--color-primary)'
            : 'color-mix(in oklch, var(--color-base-content) 30%, transparent)',
        backgroundColor: 'var(--color-base-100)',
        boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary)' : 'none',
        '&:hover': {
          borderColor: state.isFocused
            ? 'var(--color-primary)'
            : 'color-mix(in oklch, var(--color-base-content) 50%, transparent)',
        },
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: 'var(--color-base-200)',
        borderRadius: '8px',
        border: '1px solid color-mix(in oklch, var(--color-base-content) 20%, transparent)',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        zIndex: 9999,
        overflow: 'hidden',
      }),
      menuList: (base) => ({
        ...base,
        padding: 0,
        backgroundColor: 'var(--color-base-200)',
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
        color: 'var(--color-base-content)',
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused
          ? 'color-mix(in oklch, var(--color-base-200) 85%, var(--color-base-content) 15%)'
          : 'var(--color-base-200)',
        color: 'inherit',
        padding: '10px 12px',
        cursor: 'pointer',
        '&:active': {
          backgroundColor: 'color-mix(in oklch, var(--color-base-200) 75%, var(--color-base-content) 25%)',
        },
      }),
      singleValue: (base) => ({
        ...base,
        color: 'var(--color-base-content)',
      }),
      placeholder: (base) => ({
        ...base,
        color: 'color-mix(in oklch, var(--color-base-content) 50%, transparent)',
      }),
      input: (base) => ({
        ...base,
        color: 'var(--color-base-content)',
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
      dropdownIndicator: (base) => ({
        ...base,
        color: 'color-mix(in oklch, var(--color-base-content) 50%, transparent)',
        '&:hover': {
          color: 'var(--color-base-content)',
        },
      }),
      clearIndicator: (base) => ({
        ...base,
        color: 'color-mix(in oklch, var(--color-base-content) 50%, transparent)',
        '&:hover': {
          color: 'var(--color-base-content)',
        },
      }),
    }) satisfies StylesConfig<SelectOption, false>,
    [error],
  );

  const filteredClassName = className
    ?.split(' ')
    .filter((c) => !c.startsWith('select'))
    .join(' ');

  return (
    <Select<SelectOption, false>
      inputId={id}
      name={name}
      options={options}
      value={isControlled ? selectedOption : undefined}
      defaultValue={defaultOption}
      isDisabled={disabled}
      className={filteredClassName}
      styles={customStyles}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      menuPlacement="auto"
      formatOptionLabel={formatOptionLabel}
      components={{ Option: CustomOption }}
      placeholder="選択してください"
      isClearable
      isSearchable={false}
      onChange={(selected: SingleValue<SelectOption>) => {
        onChange?.(selected?.value ?? null);
      }}
    />
  );
}
