'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { initHelpSearch, searchHelp } from '@/libs/help/search';
import type { HelpIndexEntry, HelpSearchResult } from '@/libs/help/types';

interface HelpSearchProps {
  searchIndex: HelpIndexEntry[];
}

export function HelpSearch({ searchIndex }: HelpSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HelpSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (searchIndex.length > 0 && !isInitialized) {
      initHelpSearch(searchIndex);
      setIsInitialized(true);
    }
  }, [searchIndex, isInitialized]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      const searchResults = searchHelp(value);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-ghost btn-sm gap-2"
        aria-label="検索を開く"
      >
        <span className="icon-[tabler--search] size-4" />
        <span className="hidden sm:inline">検索</span>
        <kbd className="kbd kbd-xs hidden sm:inline">⌘K</kbd>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20"
          onClick={handleClose}
          onKeyDown={(e) => e.key === 'Escape' && handleClose()}
          role="dialog"
          aria-modal="true"
          aria-label="ヘルプ検索"
        >
          <div
            className="w-full max-w-lg rounded-lg bg-base-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => {}}
            role="search"
          >
            <div className="flex items-center gap-2 border-b border-base-content/10 px-4 py-3">
              <span className="icon-[tabler--search] size-5 text-base-content/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ヘルプを検索..."
                className="flex-1 bg-transparent text-base-content outline-none placeholder:text-base-content/50"
                // biome-ignore lint/a11y/noAutofocus: モーダル内検索入力には自動フォーカスが適切
                autoFocus
              />
              <kbd className="kbd kbd-sm">Esc</kbd>
            </div>

            {results.length > 0 && (
              <ul className="max-h-96 overflow-y-auto p-2">
                {results.map((result) => (
                  <li key={result.slug}>
                    <Link
                      href={`/help/${result.slug}`}
                      onClick={handleClose}
                      className="block rounded-lg px-4 py-3 hover:bg-base-200"
                    >
                      <div className="font-medium text-base-content">{result.title}</div>
                      {result.description && <div className="text-sm text-base-content/70">{result.description}</div>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center text-base-content/50">
                「{query}」に一致する結果が見つかりませんでした
              </div>
            )}

            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-base-content/50">2文字以上入力して検索</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
