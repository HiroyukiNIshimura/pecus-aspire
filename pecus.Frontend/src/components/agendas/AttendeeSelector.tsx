'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchOrganizationMemberCount,
  fetchOrganizationMembers,
  fetchWorkspaceList,
  fetchWorkspaceMembers,
  searchUsers,
  type WorkspaceOption,
} from '@/actions/agenda';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { AgendaAttendeeRequest } from '@/connectors/api/pecus';

/** デフォルトの参加者最大人数（AppSettingsから取得できない場合のフォールバック） */
const DEFAULT_MAX_ATTENDEES = 100;

/**
 * 選択済み参加者情報（UI表示用）
 */
export interface SelectedAttendee {
  userId: number;
  userName: string;
  email: string;
  identityIconUrl: string | null;
  isOptional: boolean;
  /** ワークスペース経由で追加された場合のワークスペースID */
  sourceWorkspaceId?: number;
  /** ワークスペース経由で追加された場合のワークスペース名 */
  sourceWorkspaceName?: string;
}

interface AttendeeSelectorProps {
  /** 選択済み参加者一覧 */
  selectedAttendees: SelectedAttendee[];
  /** 選択変更時のコールバック */
  onChange: (attendees: SelectedAttendee[]) => void;
  /** 無効状態 */
  disabled?: boolean;
  /** 現在のユーザーID（主催者除外用） */
  currentUserId?: number;
  /** 参加者の最大人数（AppSettingsから取得） */
  maxAttendees?: number;
}

/**
 * 参加者選択コンポーネント（改善版）
 * - クイック追加: 組織全体ボタン + ワークスペースドロップダウン
 * - ユーザー検索: 名前・メールで検索
 * - チップ表示
 * - 重複排除
 */
export default function AttendeeSelector({
  selectedAttendees,
  onChange,
  disabled = false,
  currentUserId,
  maxAttendees = DEFAULT_MAX_ATTENDEES,
}: AttendeeSelectorProps) {
  // ユーザー検索
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { userId: number; userName: string; email: string; identityIconUrl: string | null }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // クイック追加
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [orgMemberCount, setOrgMemberCount] = useState<number | null>(null);
  const [isLoadingQuickAdd, setIsLoadingQuickAdd] = useState(true);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  // 選択済みユーザーIDのセット（重複チェック用）
  const selectedUserIds = useMemo(() => new Set(selectedAttendees.map((a) => a.userId)), [selectedAttendees]);

  // 初期データ読み込み（ワークスペース一覧 + 組織メンバー数）
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingQuickAdd(true);
      try {
        const [wsResult, orgResult] = await Promise.all([fetchWorkspaceList(), fetchOrganizationMemberCount()]);

        if (wsResult.success && wsResult.data) {
          setWorkspaces(wsResult.data);
        }
        if (orgResult.success && orgResult.data !== undefined) {
          // 自分（主催者）を除いた人数を表示
          const countExcludingSelf = currentUserId ? Math.max(0, orgResult.data - 1) : orgResult.data;
          setOrgMemberCount(countExcludingSelf);
        } else {
          console.error('[AttendeeSelector] Failed to fetch org member count:', orgResult);
        }
      } catch (error) {
        console.error('[AttendeeSelector] Failed to load initial data:', error);
      } finally {
        setIsLoadingQuickAdd(false);
      }
    };

    loadInitialData();
  }, []);

  // デバウンス付きユーザー検索
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (disabled) return;

      setIsSearching(true);
      try {
        const result = await searchUsers(searchQuery);
        if (result.success && result.data) {
          // 現在のユーザーを除外
          const filtered = result.data.filter((u) => u.userId !== currentUserId);
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, disabled, currentUserId]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setShowWorkspaceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 残り追加可能人数
  const remainingSlots = maxAttendees - selectedAttendees.length;
  const isAtLimit = remainingSlots <= 0;

  // ユーザー追加
  const handleAddUser = useCallback(
    (user: { userId: number; userName: string; email: string; identityIconUrl: string | null }) => {
      if (selectedUserIds.has(user.userId)) return;
      if (selectedAttendees.length >= maxAttendees) return;

      const newAttendee: SelectedAttendee = {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        identityIconUrl: user.identityIconUrl,
        isOptional: false,
      };

      onChange([...selectedAttendees, newAttendee]);
      setSearchQuery('');
      setShowSearchDropdown(false);
    },
    [selectedAttendees, selectedUserIds, onChange],
  );

  // ワークスペースメンバーを展開して追加
  const handleAddWorkspace = useCallback(
    async (workspace: WorkspaceOption) => {
      if (selectedAttendees.length >= maxAttendees) return;

      setIsExpanding(true);
      setShowWorkspaceDropdown(false);
      try {
        const result = await fetchWorkspaceMembers(workspace.id);
        if (result.success && result.data) {
          const newAttendees: SelectedAttendee[] = [];
          const currentRemaining = maxAttendees - selectedAttendees.length;

          for (const member of result.data) {
            // 上限チェック
            if (newAttendees.length >= currentRemaining) break;
            // 既に選択済み、または現在のユーザーはスキップ
            if (selectedUserIds.has(member.userId) || member.userId === currentUserId) continue;

            newAttendees.push({
              userId: member.userId,
              userName: member.userName,
              email: member.email,
              identityIconUrl: member.identityIconUrl,
              isOptional: false,
              sourceWorkspaceId: workspace.id,
              sourceWorkspaceName: workspace.name,
            });
          }

          if (newAttendees.length > 0) {
            onChange([...selectedAttendees, ...newAttendees]);
          }
        }
      } catch (error) {
        console.error('Failed to expand workspace:', error);
      } finally {
        setIsExpanding(false);
      }
    },
    [selectedAttendees, selectedUserIds, currentUserId, onChange],
  );

  // 組織全体を展開して追加
  const handleAddOrganization = useCallback(async () => {
    if (selectedAttendees.length >= maxAttendees) return;

    setIsExpanding(true);
    try {
      const result = await fetchOrganizationMembers(maxAttendees);
      if (result.success && result.data) {
        const newAttendees: SelectedAttendee[] = [];
        const currentRemaining = maxAttendees - selectedAttendees.length;

        for (const member of result.data) {
          // 上限チェック
          if (newAttendees.length >= currentRemaining) break;
          // 既に選択済み、または現在のユーザーはスキップ
          if (selectedUserIds.has(member.userId) || member.userId === currentUserId) continue;

          newAttendees.push({
            userId: member.userId,
            userName: member.userName,
            email: member.email,
            identityIconUrl: member.identityIconUrl,
            isOptional: false,
          });
        }

        if (newAttendees.length > 0) {
          onChange([...selectedAttendees, ...newAttendees]);
        }
      }
    } catch (error) {
      console.error('[AttendeeSelector] Failed to expand organization:', error);
    } finally {
      setIsExpanding(false);
    }
  }, [selectedAttendees, selectedUserIds, currentUserId, onChange, maxAttendees]);

  // 参加者削除
  const handleRemoveAttendee = useCallback(
    (userId: number) => {
      onChange(selectedAttendees.filter((a) => a.userId !== userId));
    },
    [selectedAttendees, onChange],
  );

  // 全削除
  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <div className="space-y-4">
      {/* 主催者メモ + 参加者上限 */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="icon-[mdi--information-outline] size-4" aria-hidden="true" />
          <span>あなたは主催者として自動的に参加者に追加されます</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <span className="icon-[mdi--account-group] size-4" aria-hidden="true" />
          <span>参加者は最大{maxAttendees}人まで追加できます</span>
        </div>
      </div>

      {/* 上限警告 */}
      {isAtLimit && (
        <div className="alert alert-warning">
          <span className="icon-[mdi--alert] size-5" aria-hidden="true" />
          <span>参加者の上限（{maxAttendees}人）に達しました。追加するには既存の参加者を削除してください。</span>
        </div>
      )}

      {/* クイック追加エリア */}
      <div className="rounded-lg border border-base-300 bg-base-200/30 p-3">
        <p className="text-xs text-base-content/60 mb-2">クイック追加</p>
        <div className="flex flex-wrap gap-2">
          {/* 組織全体ボタン */}
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleAddOrganization}
            disabled={disabled || isExpanding || isLoadingQuickAdd || isAtLimit}
          >
            <span className="icon-[mdi--office-building] size-4" aria-hidden="true" />
            組織全体
            {orgMemberCount !== null && <span className="badge badge-sm">{orgMemberCount}人</span>}
            {isExpanding && <span className="loading loading-spinner loading-xs" />}
          </button>

          {/* ワークスペース選択ドロップダウン */}
          <div className="relative" ref={workspaceDropdownRef}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              disabled={disabled || isExpanding || isLoadingQuickAdd || workspaces.length === 0 || isAtLimit}
            >
              <span className="icon-[mdi--folder-account] size-4" aria-hidden="true" />
              ワークスペースから選択
              <span className="icon-[mdi--chevron-down] size-4" aria-hidden="true" />
            </button>

            {showWorkspaceDropdown && workspaces.length > 0 && (
              <div className="absolute z-20 mt-1 w-64 rounded-lg border border-base-300 bg-base-100 shadow-lg max-h-64 overflow-y-auto">
                {workspaces.map((ws) => {
                  // 自分を除いたメンバー数を表示
                  const displayMemberCount = currentUserId ? Math.max(0, ws.memberCount - 1) : ws.memberCount;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-base-200 transition-colors"
                      onClick={() => handleAddWorkspace(ws)}
                      disabled={isExpanding || isAtLimit}
                    >
                      <span className="icon-[mdi--folder-account] size-5 text-primary" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ws.name}</p>
                        <p className="text-xs text-base-content/60">{displayMemberCount}人</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ユーザー検索フィールド */}
      <div className="relative" ref={searchDropdownRef}>
        <p className="text-xs text-base-content/60 mb-1">ユーザーを個別に追加</p>
        <div className="relative">
          <span
            className="icon-[mdi--magnify] size-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
            aria-hidden="true"
          />
          <input
            type="text"
            className="input input-bordered w-full pl-10 pr-10"
            placeholder={isAtLimit ? '上限に達しています' : '名前またはメールで検索...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchDropdown(true)}
            disabled={disabled || isExpanding || isAtLimit}
          />
          {isSearching && (
            <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* 検索結果ドロップダウン */}
        {showSearchDropdown && searchResults.length > 0 && !isAtLimit && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-base-300 bg-base-100 shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((user) => {
              const isDisabled = selectedUserIds.has(user.userId);

              return (
                <button
                  key={user.userId}
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-base-200 transition-colors ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => !isDisabled && handleAddUser(user)}
                  disabled={isDisabled}
                >
                  <UserAvatar
                    userName={user.userName}
                    isActive={true}
                    identityIconUrl={user.identityIconUrl}
                    size={32}
                    showName={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.userName}</p>
                    <p className="text-sm text-base-content/60 truncate">{user.email}</p>
                  </div>
                  {isDisabled && <span className="text-xs text-base-content/50">選択済み</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* 検索ヒント */}
        {showSearchDropdown && searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-base-300 bg-base-100 shadow-lg p-4 text-center text-sm text-base-content/60">
            該当するユーザーが見つかりません
          </div>
        )}
      </div>

      {/* 選択済み参加者（チップ表示） */}
      {selectedAttendees.length > 0 && (
        <div className="rounded-lg border border-base-300 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{selectedAttendees.length}人の参加者を選択中</p>
            {!disabled && (
              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={handleClearAll}
                disabled={isExpanding}
              >
                すべて解除
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedAttendees.map((attendee) => (
              <div
                key={attendee.userId}
                className="inline-flex items-center gap-1.5 rounded-full bg-base-200 pl-1 pr-2 py-1 text-sm"
              >
                <UserAvatar
                  userName={attendee.userName}
                  isActive={true}
                  identityIconUrl={attendee.identityIconUrl}
                  size={24}
                  showName={false}
                />
                <span className="max-w-32 truncate">{attendee.userName}</span>
                {!disabled && (
                  <button
                    type="button"
                    className="btn btn-xs btn-circle btn-secondary"
                    onClick={() => handleRemoveAttendee(attendee.userId)}
                    aria-label={`${attendee.userName}を削除`}
                  >
                    <span className="icon-[mdi--close] size-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SelectedAttendee配列をAgendaAttendeeRequest配列に変換
 */
export function toAgendaAttendeeRequests(attendees: SelectedAttendee[]): AgendaAttendeeRequest[] {
  return attendees.map((a) => ({
    userId: a.userId,
    isOptional: a.isOptional,
  }));
}
