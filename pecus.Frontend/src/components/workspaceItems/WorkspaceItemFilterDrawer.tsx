'use client';

import { useEffect, useState } from 'react';
import { searchUsersForWorkspace } from '@/actions/admin/user';
import BooleanFilterGroup from '@/components/common/filters/BooleanFilterGroup';
import DebouncedSearchInput from '@/components/common/filters/DebouncedSearchInput';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { TaskPriority, UserSearchResultResponse } from '@/connectors/api/pecus';

export interface WorkspaceItemFilters {
  /** 担当者ID */
  assigneeId?: number | null;
  /** オーナーID */
  ownerId?: number | null;
  /** コミッターID（最後にコミットしたユーザー） */
  committerId?: number | null;
  /** 優先度 */
  priority?: TaskPriority | null;
  /** 下書きかどうか */
  isDraft?: boolean | null;
  /** アーカイブ済みかどうか */
  isArchived?: boolean | null;
  /** ピン留めされているかどうか */
  pinned?: boolean | null;
  /** 期限日が設定されているかどうか */
  hasDueDate?: boolean | null;
}

/** 選択されたユーザー情報 */
interface SelectedUser {
  id: number;
  username: string;
  email: string;
  identityIconUrl: string | null;
}

/** 現在のユーザー情報（自分を選択するために必要） */
interface CurrentUser {
  id: number;
  username: string;
  email: string;
  identityIconUrl: string | null;
}

interface WorkspaceItemFilterDrawerProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  currentFilters: WorkspaceItemFilters;
  onApplyFilters: (filters: WorkspaceItemFilters) => void;
  /** 現在ログイン中のユーザー（「自分」リンク用） */
  currentUser?: CurrentUser | null;
}

/** 優先度の選択肢 */
const priorityOptions: { value: NonNullable<TaskPriority> | ''; label: string }[] = [
  { value: '', label: 'すべて' },
  { value: 'Low', label: '低' },
  { value: 'Medium', label: '中' },
  { value: 'High', label: '高' },
  { value: 'Critical', label: '緊急' },
];

/** ユーザー検索フィルターのProps */
interface UserSearchFilterProps {
  label: string;
  selectedUser: SelectedUser | null;
  searchResults: UserSearchResultResponse[];
  isSearching: boolean;
  showDropdown: boolean;
  onSearch: (query: string) => void;
  onSelectUser: (user: UserSearchResultResponse) => void;
  onClear: () => void;
  onFocus: () => void;
  onBlur: () => void;
  /** 現在ログイン中のユーザー（「自分」リンク用） */
  currentUser?: CurrentUser | null;
  /** 「自分」をクリックしたときのコールバック */
  onSelectSelf?: () => void;
}

/** ユーザー検索フィルターコンポーネント */
function UserSearchFilter({
  label,
  selectedUser,
  searchResults,
  isSearching,
  showDropdown,
  onSearch,
  onSelectUser,
  onClear,
  onFocus,
  onBlur,
  currentUser,
  onSelectSelf,
}: UserSearchFilterProps) {
  return (
    <div className="form-control">
      <div className="flex flex-row items-center justify-between py-1">
        <span className="label-text font-semibold">{label}</span>
        {currentUser && onSelectSelf && (
          <button type="button" className="link link-primary text-xs" onClick={onSelectSelf}>
            （自分）
          </button>
        )}
      </div>
      {selectedUser ? (
        <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
          <UserAvatar
            userName={selectedUser.username}
            identityIconUrl={selectedUser.identityIconUrl}
            size={24}
            showName={false}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedUser.username}</p>
            <p className="text-xs text-base-content/60 truncate">{selectedUser.email}</p>
          </div>
          <button type="button" className="btn btn-xs btn-circle" onClick={onClear} aria-label="選択解除">
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
      ) : (
        <div className="relative">
          <DebouncedSearchInput
            onSearch={onSearch}
            placeholder="名前またはメールで検索..."
            debounceMs={300}
            size="sm"
            isLoading={isSearching}
            showSearchIcon={true}
            showClearButton={true}
          />
          <div onFocus={onFocus} onBlur={onBlur} className="absolute inset-0 pointer-events-none" />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full flex items-center gap-2 p-2 hover:bg-base-200 transition-colors text-left"
                  onClick={() => onSelectUser(user)}
                >
                  <UserAvatar
                    userName={user.username}
                    identityIconUrl={user.identityIconUrl}
                    size={24}
                    showName={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.username}</p>
                    <p className="text-xs text-base-content/60 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showDropdown && !isSearching && searchResults.length === 0 && (
            <div className="text-xs text-base-content/50 mt-1">2文字以上で検索</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceItemFilterDrawer({
  isOpen,
  isClosing,
  onClose,
  currentFilters,
  onApplyFilters,
  currentUser,
}: WorkspaceItemFilterDrawerProps) {
  const [filters, setFilters] = useState<WorkspaceItemFilters>(currentFilters);

  // ユーザー検索の状態（担当者用）
  const [assigneeSearchResults, setAssigneeSearchResults] = useState<UserSearchResultResponse[]>([]);
  const [isSearchingAssignee, setIsSearchingAssignee] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<SelectedUser | null>(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // ユーザー検索の状態（オーナー用）
  const [ownerSearchResults, setOwnerSearchResults] = useState<UserSearchResultResponse[]>([]);
  const [isSearchingOwner, setIsSearchingOwner] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<SelectedUser | null>(null);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

  // ユーザー検索の状態（コミッター用）
  const [committerSearchResults, setCommitterSearchResults] = useState<UserSearchResultResponse[]>([]);
  const [isSearchingCommitter, setIsSearchingCommitter] = useState(false);
  const [selectedCommitter, setSelectedCommitter] = useState<SelectedUser | null>(null);
  const [showCommitterDropdown, setShowCommitterDropdown] = useState(false);

  // currentFiltersが変更されたらfiltersを更新
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: WorkspaceItemFilters = {
      assigneeId: null,
      ownerId: null,
      committerId: null,
      priority: null,
      isDraft: null,
      isArchived: null,
      pinned: null,
      hasDueDate: null,
    };
    setFilters(resetFilters);
    setSelectedAssignee(null);
    setSelectedOwner(null);
    setSelectedCommitter(null);
    onApplyFilters(resetFilters);
    onClose();
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== null && v !== undefined && v !== '').length;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
      `}</style>

      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
        style={{
          animation: isClosing ? 'fadeOut 0.25s ease-out' : 'fadeIn 0.2s ease-out',
        }}
      />

      {/* ドローワー本体（左から表示） */}
      <div
        id="workspace-item-filter-drawer"
        className="fixed top-0 left-0 h-full w-80 bg-base-100 shadow-xl z-50 overflow-y-auto flex flex-col transition-transform duration-300 ease-out"
        role="dialog"
        tabIndex={-1}
        style={{
          animation: isClosing ? 'slideOutLeft 0.25s ease-in' : 'slideInLeft 0.3s ease-out',
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h3 className="text-lg font-bold">詳細フィルター</h3>
            {activeFilterCount > 0 && <span className="badge badge-primary badge-sm">{activeFilterCount}</span>}
          </div>
          <button type="button" className="btn btn-circle btn-sm" aria-label="閉じる" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* 担当者フィルター（ユーザー検索） */}
          <UserSearchFilter
            label="担当者"
            selectedUser={selectedAssignee}
            searchResults={assigneeSearchResults}
            isSearching={isSearchingAssignee}
            showDropdown={showAssigneeDropdown}
            onSearch={async (query) => {
              setShowAssigneeDropdown(true);
              if (!query.trim() || query.length < 2) {
                setAssigneeSearchResults([]);
                return;
              }
              setIsSearchingAssignee(true);
              try {
                const result = await searchUsersForWorkspace(query);
                if (result.success && result.data) {
                  setAssigneeSearchResults(result.data);
                } else {
                  setAssigneeSearchResults([]);
                }
              } catch {
                setAssigneeSearchResults([]);
              } finally {
                setIsSearchingAssignee(false);
              }
            }}
            onSelectUser={(user) => {
              setSelectedAssignee({
                id: user.id!,
                username: user.username!,
                email: user.email!,
                identityIconUrl: user.identityIconUrl ?? null,
              });
              setFilters({ ...filters, assigneeId: user.id! });
              setShowAssigneeDropdown(false);
              setAssigneeSearchResults([]);
            }}
            onClear={() => {
              setSelectedAssignee(null);
              setFilters({ ...filters, assigneeId: null });
            }}
            onFocus={() => setShowAssigneeDropdown(true)}
            onBlur={() => {
              // 少し遅延させてクリックイベントを処理できるようにする
              setTimeout(() => setShowAssigneeDropdown(false), 200);
            }}
            currentUser={currentUser}
            onSelectSelf={
              currentUser
                ? () => {
                    setSelectedAssignee({
                      id: currentUser.id,
                      username: currentUser.username,
                      email: currentUser.email,
                      identityIconUrl: currentUser.identityIconUrl,
                    });
                    setFilters({ ...filters, assigneeId: currentUser.id });
                  }
                : undefined
            }
          />

          {/* オーナーフィルター（ユーザー検索） */}
          <UserSearchFilter
            label="オーナー"
            selectedUser={selectedOwner}
            searchResults={ownerSearchResults}
            isSearching={isSearchingOwner}
            showDropdown={showOwnerDropdown}
            onSearch={async (query) => {
              setShowOwnerDropdown(true);
              if (!query.trim() || query.length < 2) {
                setOwnerSearchResults([]);
                return;
              }
              setIsSearchingOwner(true);
              try {
                const result = await searchUsersForWorkspace(query);
                if (result.success && result.data) {
                  setOwnerSearchResults(result.data);
                } else {
                  setOwnerSearchResults([]);
                }
              } catch {
                setOwnerSearchResults([]);
              } finally {
                setIsSearchingOwner(false);
              }
            }}
            onSelectUser={(user) => {
              setSelectedOwner({
                id: user.id!,
                username: user.username!,
                email: user.email!,
                identityIconUrl: user.identityIconUrl ?? null,
              });
              setFilters({ ...filters, ownerId: user.id! });
              setShowOwnerDropdown(false);
              setOwnerSearchResults([]);
            }}
            onClear={() => {
              setSelectedOwner(null);
              setFilters({ ...filters, ownerId: null });
            }}
            onFocus={() => setShowOwnerDropdown(true)}
            onBlur={() => {
              setTimeout(() => setShowOwnerDropdown(false), 200);
            }}
            currentUser={currentUser}
            onSelectSelf={
              currentUser
                ? () => {
                    setSelectedOwner({
                      id: currentUser.id,
                      username: currentUser.username,
                      email: currentUser.email,
                      identityIconUrl: currentUser.identityIconUrl,
                    });
                    setFilters({ ...filters, ownerId: currentUser.id });
                  }
                : undefined
            }
          />

          {/* コミッターフィルター（ユーザー検索） */}
          <UserSearchFilter
            label="コミッター"
            selectedUser={selectedCommitter}
            searchResults={committerSearchResults}
            isSearching={isSearchingCommitter}
            showDropdown={showCommitterDropdown}
            onSearch={async (query) => {
              setShowCommitterDropdown(true);
              if (!query.trim() || query.length < 2) {
                setCommitterSearchResults([]);
                return;
              }
              setIsSearchingCommitter(true);
              try {
                const result = await searchUsersForWorkspace(query);
                if (result.success && result.data) {
                  setCommitterSearchResults(result.data);
                } else {
                  setCommitterSearchResults([]);
                }
              } catch {
                setCommitterSearchResults([]);
              } finally {
                setIsSearchingCommitter(false);
              }
            }}
            onSelectUser={(user) => {
              setSelectedCommitter({
                id: user.id!,
                username: user.username!,
                email: user.email!,
                identityIconUrl: user.identityIconUrl ?? null,
              });
              setFilters({ ...filters, committerId: user.id! });
              setShowCommitterDropdown(false);
              setCommitterSearchResults([]);
            }}
            onClear={() => {
              setSelectedCommitter(null);
              setFilters({ ...filters, committerId: null });
            }}
            onFocus={() => setShowCommitterDropdown(true)}
            onBlur={() => {
              setTimeout(() => setShowCommitterDropdown(false), 200);
            }}
            currentUser={currentUser}
            onSelectSelf={
              currentUser
                ? () => {
                    setSelectedCommitter({
                      id: currentUser.id,
                      username: currentUser.username,
                      email: currentUser.email,
                      identityIconUrl: currentUser.identityIconUrl,
                    });
                    setFilters({ ...filters, committerId: currentUser.id });
                  }
                : undefined
            }
          />

          <div className="divider my-2">優先度・ステータス</div>

          {/* 優先度フィルター */}
          <div className="form-control">
            <label htmlFor="filter-priority" className="label">
              <span className="label-text font-semibold">優先度</span>
            </label>
            <select
              id="filter-priority"
              value={filters.priority ?? ''}
              onChange={(e) => setFilters({ ...filters, priority: (e.target.value as TaskPriority) || null })}
              className="select select-bordered select-sm"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="divider my-2">フラグ</div>

          {/* 下書きフィルター */}
          <BooleanFilterGroup
            label="下書き"
            name="filter-draft"
            value={filters.isDraft}
            onChange={(value) => setFilters({ ...filters, isDraft: value })}
          />

          {/* アーカイブフィルター */}
          <BooleanFilterGroup
            label="アーカイブ済み"
            name="filter-archived"
            value={filters.isArchived}
            onChange={(value) => setFilters({ ...filters, isArchived: value })}
          />

          {/* ピン留めフィルター */}
          <BooleanFilterGroup
            label="ピン留め"
            name="filter-pinned"
            value={filters.pinned}
            onChange={(value) => setFilters({ ...filters, pinned: value })}
          />

          {/* 期限日有無フィルター */}
          <BooleanFilterGroup
            label="期限日あり"
            name="filter-has-due-date"
            value={filters.hasDueDate}
            onChange={(value) => setFilters({ ...filters, hasDueDate: value })}
          />
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-4 border-t border-base-300 bg-base-100 sticky bottom-0">
          <button type="button" className="btn btn-outline btn-sm flex-1" onClick={handleReset}>
            リセット
          </button>
          <button type="button" className="btn btn-primary btn-sm flex-1" onClick={handleApply}>
            適用
          </button>
        </div>
      </div>
    </>
  );
}
