'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MasterGenreResponse } from '@/connectors/api/pecus';

export interface GenreSelectProps {
  id?: string;
  name?: string;
  genres: MasterGenreResponse[];
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
 */
export default function GenreSelect({
  id = 'genreId',
  name = 'genreId',
  genres,
  defaultValue = '',
  disabled,
  error,
  className,
  onChange,
}: GenreSelectProps) {
  const [selectedGenreIcon, setSelectedGenreIcon] = useState<string | null>(null);

  const initialIcon = useMemo(() => {
    const gid = typeof defaultValue === 'number' ? defaultValue : null;
    return gid ? genres.find((g) => g.id === gid)?.icon ?? null : null;
  }, [defaultValue, genres]);

  useEffect(() => {
    setSelectedGenreIcon(initialIcon);
  }, [initialIcon]);

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
      `}</style>

      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        className={`select select-bordered genre-select ${error ? 'select-error' : ''} ${className ?? ''}`}
        disabled={disabled || genres.length === 0}
        onChange={(e) => {
          const val = e.target.value;
          const gid = val ? parseInt(val, 10) : null;
          const icon = gid ? genres.find((g) => g.id === gid)?.icon ?? null : null;
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
