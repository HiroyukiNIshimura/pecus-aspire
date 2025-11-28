'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchUsersForWorkspace } from '@/actions/admin/user';
import type { UserSearchResultResponse, WorkspaceRole, WorkspaceUserItem } from '@/connectors/api/pecus';

interface AddMemberModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** 既存メンバー一覧（重複防止用） */
  existingMembers: WorkspaceUserItem[];
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** メンバー追加確定時のコールバック */
  onConfirm: (
    userId: number,
    userName: string,
    email: string,
    role: WorkspaceRole,
    identityIconUrl: string | null,
  ) => Promise<void>;
}

/** ロール選択肢 */
const roleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: 'Member', label: 'メンバー' },
  { value: 'Viewer', label: '閲覧者' },
  { value: 'Owner', label: 'オーナー' },
];

/**
 * メンバー追加モーダル
 * - サーバーサイド検索（デバウンス付き）
 * - ロール選択
 * - 追加確認
 */
export default function AddMemberModal({ isOpen, existingMembers, onClose, onConfirm }: AddMemberModalProps) {
  // 検索状態
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResultResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 選択状態
  const [selectedUser, setSelectedUser] = useState<UserSearchResultResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>('Member');
  const [isAdding, setIsAdding] = useState(false);

  // 既存メンバーのIDセット
  const existingMemberIds = useMemo(() => new Set(existingMembers.map((m) => m.userId)), [existingMembers]);

  // 検索結果から既存メンバーを除外
  const availableResults = useMemo(
    () => searchResults.filter((u) => !existingMemberIds.has(u.id!)),
    [searchResults, existingMemberIds],
  );

  // デバウンス付き検索
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUsersForWorkspace(query);
      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // モーダルクローズ時にリセット
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedRole('Member');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isAdding) {
      onClose();
    }
  };

  const handleSelectUser = (user: UserSearchResultResponse) => {
    setSelectedUser(user);
  };
  const handleClearSelection = () => {
    setSelectedUser(null);
  };

  const handleConfirm = async () => {
    if (!selectedUser || isAdding) {
      return;
    }

    setIsAdding(true);
    try {
      await onConfirm(
        selectedUser.id!,
        selectedUser.username!,
        selectedUser.email!,
        selectedRole,
        selectedUser.identityIconUrl ?? null,
      );
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      {/* モーダルコンテンツ */}
      <div
        className="relative bg-base-100 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg">メンバーを追加</h3>

        {/* メインコンテンツ */}
        <>
          {/* 選択済みユーザー表示 */}
          {selectedUser ? (
            <div className="bg-base-200 rounded-lg p-4 my-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-10">
                      <span className="text-sm">{selectedUser.username?.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedUser.username}</p>
                    <p className="text-sm text-base-content/70">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={handleClearSelection}
                  aria-label="選択解除"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ロール選択 */}
              <div className="form-control mt-4">
                <label htmlFor="roleSelect" className="label">
                  <span className="label-text font-semibold">ロールを選択</span>
                </label>
                <select
                  id="roleSelect"
                  className="select select-bordered w-full"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as WorkspaceRole)}
                  disabled={isAdding}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* ユーザー検索 */
            <div className="my-4 flex flex-col flex-1 min-h-0">
              <div className="form-control">
                <label htmlFor="userSearch" className="label">
                  <span className="label-text font-semibold">ユーザーを検索</span>
                </label>
                <div className="relative">
                  <input
                    id="userSearch"
                    type="text"
                    placeholder="名前またはメールアドレスで検索..."
                    className="input input-bordered w-full pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="loading loading-spinner loading-sm" />
                    </div>
                  )}
                </div>
                <div className="label">
                  <span className="label-text-alt text-base-content/60">2文字以上入力すると検索します</span>
                </div>
              </div>

              {/* 検索結果一覧 */}
              <div className="flex-1 overflow-y-auto border border-base-300 rounded-lg min-h-[200px] max-h-[300px]">
                {!searchQuery.trim() ? (
                  <div className="flex items-center justify-center h-full text-base-content/50">
                    ユーザー名またはメールアドレスを入力してください
                  </div>
                ) : isSearching ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="loading loading-spinner loading-md" />
                    <span className="ml-2">検索中...</span>
                  </div>
                ) : availableResults.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-base-content/50">
                    該当するユーザーが見つかりません
                  </div>
                ) : (
                  <ul className="divide-y divide-base-300">
                    {availableResults.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 p-3 hover:bg-base-200 transition-colors text-left"
                          onClick={() => handleSelectUser(user)}
                        >
                          {/* アバター */}
                          <div className="avatar placeholder flex-shrink-0">
                            <div className="bg-primary text-primary-content rounded-full w-10">
                              <span className="text-sm">{user.username?.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>

                          {/* ユーザー情報 */}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{user.username || '(名前なし)'}</p>
                            <p className="text-sm text-base-content/70 truncate">{user.email}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 件数表示 */}
              {availableResults.length > 0 && (
                <div className="text-xs text-base-content/50 mt-2">{availableResults.length} 件ヒット</div>
              )}
            </div>
          )}
        </>

        {/* ボタン */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-base-300">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={isAdding}>
            キャンセル
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!selectedUser || isAdding}
          >
            {isAdding ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                追加中...
              </>
            ) : (
              '追加する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
