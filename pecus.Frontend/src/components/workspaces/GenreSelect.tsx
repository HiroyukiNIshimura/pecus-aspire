'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MasterGenreResponse } from '@/connectors/api/pecus';

export interface GenreSelectProps {
  id?: string;
  name?: string;
  genres: MasterGenreResponse[];
  /** 制御コンポーネント用の値（優先） */
  value?: number | null;
  /** 非制御コンポーネント用の初期値 */
  defaultValue?: number | '' | null;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  onChange?: (value: number | null) => void;
}

/**
 * ジャンル選択セレクト（アイコン表示対応）
 * - option 内に SVG を表示
 * - 選択済み表示にも背景アイコンを表示
 * - value を指定すると制御コンポーネントとして動作
 */
export default function GenreSelect({
  id = 'genreId',
  name = 'genreId',
  genres,
  value,
  defaultValue = '',
  disabled,
  error,
  className,
  onChange,
}: GenreSelectProps) {
  // value が指定されている場合は制御コンポーネントとして動作
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : undefined;

  const [selectedGenreIcon, setSelectedGenreIcon] = useState<string | null>(null);

  // 制御コンポーネントの場合は value から、非制御の場合は defaultValue からアイコンを取得
  const iconValue = isControlled ? value : typeof defaultValue === 'number' ? defaultValue : null;

  const currentIcon = useMemo(() => {
    return iconValue ? (genres.find((g) => g.id === iconValue)?.icon ?? null) : null;
  }, [iconValue, genres]);

  useEffect(() => {
    setSelectedGenreIcon(currentIcon);
  }, [currentIcon]);

  return (
    <>
      <style jsx>{`
        :global(.genre-select) {
          appearance: base-select;
          min-width: 220px;
          height: 44px;
          border-color: #a4a4a4;
          border-radius: 8px;
          align-items: center;
          padding: 8px;
        }
        :global(.genre-select option) {
          padding: 8px;
          background-color: var(--color-base-200);
        }
        :global(.genre-select option:hover) {
          background-color: var(--color-base-100);
        }
        :global(.genre-select option img) {
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
        className={`select select-bordered genre-select ${error ? 'select-error' : ''} ${className ?? ''}`}
        disabled={disabled || genres.length === 0}
        onChange={(e) => {
          const val = e.target.value;
          const gid = val ? parseInt(val, 10) : null;
          const icon = gid ? (genres.find((g) => g.id === gid)?.icon ?? null) : null;
          setSelectedGenreIcon(icon);
          onChange?.(gid);
        }}
        style={{
          backgroundImage: selectedGenreIcon ? `url(/icons/genres/${selectedGenreIcon}.svg)` : 'none',
          backgroundPosition: '12px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '20px 20px',
          paddingLeft: selectedGenreIcon ? '40px' : undefined,
        }}
      >
        <option value="">選択してください</option>
        {genres.map((genre) => (
          <option key={genre.id} value={genre.id}>
            <img src={`/icons/genres/${genre.icon}.svg`} alt="" className="w-4 h-4 inline-block mr-2" />
            {genre.name}
          </option>
        ))}
      </select>
    </>
  );
}
