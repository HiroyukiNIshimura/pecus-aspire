'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchUsers } from '@/actions/chat';
import type { UserSearchResultResponse } from '@/connectors/api/pecus';

interface DmUserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: number) => void;
  /** 既存DMがあるユーザーID（除外用） */
  existingDmUserIds: number[];
}

/**
 * DMユーザー検索モーダル
 * 「他のユーザーを探す」ボタンから開くモーダル
 */
export default function DmUserSearchModal({
  isOpen,
  onClose,
  onSelectUser,
  existingDmUserIds,
}: DmUserSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResultResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // モーダルを開いたときにフォーカス
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
      // 少し遅延させてフォーカス
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Escapeキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 検索実行（デバウンス付き）
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      const result = await searchUsers(searchQuery, 20);

      if (result.success) {
        // 既存DMがあるユーザーを除外
        const filtered = result.data.filter((u) => u.id && !existingDmUserIds.includes(u.id));
        setResults(filtered);
      } else {
        setError(result.error || '検索に失敗しました');
        setResults([]);
      }

      setLoading(false);
    },
    [existingDmUserIds],
  );

  // 入力変更時のデバウンス処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // 既存のタイマーをクリア
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 300ms後に検索実行
    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        // 背景クリックで閉じる
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
          <h2 className="text-lg font-bold">ユーザーを検索</h2>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" aria-label="閉じる" onClick={onClose}>
            <span className="icon-[tabler--x] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* 検索入力 */}
        <div className="p-4 border-b border-base-300 shrink-0">
          <div className="relative">
            <span className="icon-[tabler--search] size-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
            <input
              ref={inputRef}
              type="text"
              className="input input-bordered w-full pl-10"
              placeholder="名前またはメールで検索..."
              value={query}
              onChange={handleInputChange}
            />
            {loading && (
              <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          {query.length > 0 && query.length < 2 && (
            <p className="text-xs text-base-content/50 mt-1">2文字以上入力してください</p>
          )}
        </div>

        {/* 検索結果 */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4">
              <div className="alert alert-error alert-soft">
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && !error && (
            <div className="flex items-center justify-center h-32 text-base-content/50">該当するユーザーがいません</div>
          )}

          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors text-left"
              onClick={() => user.id && onSelectUser(user.id)}
            >
              {/* アバター */}
              <div className="shrink-0">
                {user.identityIconUrl ? (
                  <img src={user.identityIconUrl} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-base-300 flex items-center justify-center">
                    <span className="icon-[tabler--user] size-5 text-base-content/50" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* ユーザー情報 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user.username}</div>
                <div className="text-xs text-base-content/50 truncate">{user.email}</div>
              </div>
            </button>
          ))}

          {!loading && query.length === 0 && (
            <div className="flex items-center justify-center h-32 text-base-content/50">
              ユーザー名またはメールで検索
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
