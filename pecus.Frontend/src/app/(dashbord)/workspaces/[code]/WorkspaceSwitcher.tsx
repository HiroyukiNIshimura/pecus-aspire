'use client';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkspaceListItemResponse } from '@/connectors/api/pecus';

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceListItemResponse[];
  currentWorkspaceCode: string;
}

/**
 * ワークスペース切り替えコンポーネント
 * - Enterキーまたはクリックでドロップダウン展開
 * - ドロップダウンから任意のワークスペースを選択
 */
export default function WorkspaceSwitcher({ workspaces, currentWorkspaceCode }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 現在のワークスペースのインデックスを取得
  const currentIndex = workspaces.findIndex((ws) => ws.code === currentWorkspaceCode);

  // 現在のワークスペース情報
  const currentWorkspace = workspaces[currentIndex];

  // ワークスペース切り替え処理
  const switchWorkspace = useCallback(
    (workspaceCode: string) => {
      if (workspaceCode !== currentWorkspaceCode) {
        router.push(`/workspaces/${workspaceCode}`);
      }
      setIsOpen(false);
    },
    [currentWorkspaceCode, router],
  );

  // キーボード操作（Enterとエスケープのみ）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (workspaces.length === 0) return;

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
    },
    [workspaces],
  );

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

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* メインボタン */}
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-base-100 hover:bg-base-300 border border-base-300 rounded transition-colors text-left"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Enterキーまたはクリックでワークスペースを選択"
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs text-base-content/70 mb-1">ワークスペース</div>
          <div className="font-semibold text-sm truncate flex items-center gap-2">
            {currentWorkspace?.genreIcon && (
              <img
                src={`/icons/genres/${currentWorkspace.genreIcon}.svg`}
                alt={currentWorkspace.genreName || 'ジャンルアイコン'}
                className="w-5 h-5 flex-shrink-0"
              />
            )}
            <span>{currentWorkspace?.name || 'ワークスペース'}</span>
          </div>
          {currentWorkspace?.code && (
            <code className="text-xs text-base-content/70 truncate block">{currentWorkspace.code}</code>
          )}
        </div>
        <KeyboardArrowDownIcon className="w-5 h-5 text-base-content/50 flex-shrink-0" />
      </button>

      {/* ドロップダウンリスト */}
      {isOpen && (
        <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-base-100 border border-base-300 rounded shadow-lg">
          {workspaces.map((workspace) => (
            <li key={workspace.id} aria-selected={workspace.code === currentWorkspaceCode}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 hover:bg-base-200 transition-colors ${
                  workspace.code === currentWorkspaceCode ? 'bg-primary/10 font-semibold' : ''
                }`}
                onClick={() => workspace.code && switchWorkspace(workspace.code)}
              >
                <div className="text-sm truncate">{workspace.name}</div>
                {workspace.code && (
                  <code className="text-xs text-base-content/70 truncate block">{workspace.code}</code>
                )}
                {workspace.genreName && (
                  <div className="text-xs text-base-content/70 mt-1 flex items-center gap-1">
                    {workspace.genreIcon && <span>{workspace.genreIcon}</span>}
                    {workspace.genreName}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
