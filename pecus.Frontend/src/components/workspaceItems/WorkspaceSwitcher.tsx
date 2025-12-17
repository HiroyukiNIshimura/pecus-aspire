'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getMyWorkspacesPaged } from '@/actions/workspace';
import type { WorkspaceListItemResponse } from '@/connectors/api/pecus';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface WorkspaceSwitcherProps {
  /** 現在のワークスペースコード */
  currentWorkspaceCode: string;
  /** 現在のワークスペース情報（初期表示用） */
  currentWorkspace?: {
    name: string;
    code: string;
    genreIcon?: string | null;
    genreName?: string | null;
    mode?: string | null;
  };
}

/**
 * ワークスペース切り替えコンポーネント
 * - Enterキーまたはクリックでドロップダウン展開
 * - ドロップダウンから任意のワークスペースを選択
 * - 無限スクロールでワークスペース一覧を遅延読み込み
 */
export default function WorkspaceSwitcher({ currentWorkspaceCode, currentWorkspace }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // ワークスペース一覧の状態
  const [workspaces, setWorkspaces] = useState<WorkspaceListItemResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 初回読み込み済みフラグ
  const hasLoadedRef = useRef(false);

  // ワークスペース一覧を読み込む
  const loadWorkspaces = useCallback(async () => {
    const nextPage = currentPage + 1;
    const result = await getMyWorkspacesPaged(nextPage);

    if (result.success) {
      setWorkspaces((prev) => {
        // 重複を除外して追加
        const existingIds = new Set(prev.map((w) => w.id));
        const newItems = result.data.data.filter((w) => !existingIds.has(w.id));
        return [...prev, ...newItems];
      });
      setCurrentPage(result.data.currentPage);
      setHasMore(result.data.hasMore);
      setLoadError(null);
    } else {
      setLoadError(result.message);
    }
  }, [currentPage]);

  // 無限スクロール
  const { sentinelRef, isLoading } = useInfiniteScroll({
    onLoadMore: loadWorkspaces,
    hasMore,
    scrollContainerRef: listRef,
    rootMargin: '50px',
    disabled: !isOpen,
  });

  // ドロップダウンを開いた時に初回読み込み
  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIsInitialLoading(true);
      loadWorkspaces().finally(() => {
        setIsInitialLoading(false);
      });
    }
  }, [isOpen, loadWorkspaces]);

  // ワークスペース切り替え処理
  const switchWorkspace = useCallback(
    (workspaceCode: string) => {
      if (workspaceCode !== currentWorkspaceCode) {
        setIsNavigating(true);
        setIsOpen(false);
        router.push(`/workspaces/${workspaceCode}`);
      } else {
        setIsOpen(false);
      }
    },
    [currentWorkspaceCode, router],
  );

  // キーボード操作（Enterとエスケープのみ）
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen((prev) => !prev);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, []);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* ナビゲーション中のオーバーレイ */}
      {isNavigating && (
        <div className="absolute inset-0 bg-base-100/80 z-10 flex items-center justify-center rounded">
          <span className="loading loading-spinner loading-sm" />
        </div>
      )}

      {/* メインボタン */}
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-base-100 hover:bg-base-200 border border-base-300 rounded transition-colors text-left"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isNavigating}
        title="Enterキーまたはクリックでワークスペースを選択"
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs text-base-content/70 mb-1">ワークスペース</div>
          <div className="font-semibold text-sm truncate flex items-center gap-2">
            {currentWorkspace?.genreIcon && (
              <img
                src={`/icons/genres/${currentWorkspace.genreIcon}.svg`}
                alt={currentWorkspace.genreName || 'ジャンルアイコン'}
                title={currentWorkspace.genreName || 'ジャンル'}
                className="w-5 h-5 flex-shrink-0"
              />
            )}
            <span className="truncate">{currentWorkspace?.name || 'ワークスペース'}</span>
            {currentWorkspace?.mode === 'Document' && (
              <span
                className="icon-[mdi--file-document-outline] text-lg align-middle ml-1"
                title="ドキュメントワークスペース"
                aria-label="ドキュメントワークスペース"
              />
            )}
          </div>
          {currentWorkspace?.code && (
            <code className="text-xs text-base-content/70 truncate block">{currentWorkspace.code}</code>
          )}
        </div>
        <span className="icon-[mdi--chevron-down] w-5 h-5 text-base-content/50 flex-shrink-0" aria-hidden="true" />
      </button>

      {/* ドロップダウンリスト */}
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-base-100 border border-base-300 rounded shadow-lg"
        >
          {/* 初回ローディング */}
          {isInitialLoading && (
            <li className="flex items-center justify-center py-4">
              <span className="loading loading-spinner loading-sm" />
            </li>
          )}

          {/* エラー表示 */}
          {loadError && !isInitialLoading && <li className="px-3 py-2 text-sm text-error">{loadError}</li>}

          {/* ワークスペース一覧 */}
          {!isInitialLoading &&
            workspaces.map((workspace) => (
              <li key={workspace.id} aria-selected={workspace.code === currentWorkspaceCode}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-base-200 transition-colors ${
                    workspace.code === currentWorkspaceCode ? 'bg-primary/10 font-semibold' : ''
                  }`}
                  onClick={() => workspace.code && switchWorkspace(workspace.code)}
                >
                  <div className="text-sm truncate flex items-center gap-2">
                    {workspace.genreIcon && (
                      <img
                        src={`/icons/genres/${workspace.genreIcon}.svg`}
                        alt={workspace.genreName || 'ジャンルアイコン'}
                        title={workspace.genreName || 'ジャンル'}
                        className="w-5 h-5 flex-shrink-0"
                      />
                    )}
                    <span>{workspace.name}</span>
                  </div>
                  {workspace.code && (
                    <code className="text-xs text-base-content/70 truncate block">{workspace.code}</code>
                  )}
                </button>
              </li>
            ))}

          {/* 無限スクロール用センチネル */}
          {!isInitialLoading && hasMore && <li ref={sentinelRef} aria-hidden="true" className="h-1" />}

          {/* 追加ローディング */}
          {isLoading && !isInitialLoading && (
            <li className="flex items-center justify-center py-2">
              <span className="loading loading-spinner loading-xs" />
            </li>
          )}

          {/* データなし */}
          {!isInitialLoading && !loadError && workspaces.length === 0 && (
            <li className="px-3 py-2 text-sm text-base-content/60">ワークスペースがありません</li>
          )}
        </ul>
      )}
    </div>
  );
}
