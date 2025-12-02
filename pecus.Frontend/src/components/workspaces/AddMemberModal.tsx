'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchUsersForWorkspace } from '@/actions/admin/user';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import type { UserSearchResultResponse, WorkspaceRole, WorkspaceUserItem } from '@/connectors/api/pecus';
import { getDisplayIconUrl } from '@/utils/imageUrl';

/**
 * スキルマッチング用のスキル情報
 */
export interface SkillItem {
  id: number;
  name: string;
}

/**
 * スキルマッチング結果
 */
interface SkillMatchResult {
  /** マッチ率（0-100） */
  matchPercentage: number;
  /** マッチしたスキル */
  matchedSkills: SkillItem[];
  /** 不足しているスキル */
  missingSkills: SkillItem[];
  /** ユーザーの追加スキル（ワークスペースでは不要だがユーザーが持っているスキル） */
  extraSkills: SkillItem[];
}

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
  /** スキルマッチングを表示するかどうか */
  showSkillMatching?: boolean;
  /** ワークスペースで必要なスキル一覧（スキルマッチング用） */
  requiredSkills?: SkillItem[];
}

/** ロール選択肢 */
const roleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: 'Member', label: 'メンバー' },
  { value: 'Viewer', label: '閲覧者' },
  { value: 'Owner', label: 'オーナー' },
];

/**
 * スキルマッチング度を計算
 */
function calculateSkillMatch(requiredSkills: SkillItem[], userSkills: SkillItem[]): SkillMatchResult {
  const requiredIds = new Set(requiredSkills.map((s) => s.id));
  const userIds = new Set(userSkills.map((s) => s.id));

  const matchedSkills = requiredSkills.filter((s) => userIds.has(s.id));
  const missingSkills = requiredSkills.filter((s) => !userIds.has(s.id));
  const extraSkills = userSkills.filter((s) => !requiredIds.has(s.id));

  // マッチ率: 必須スキルがない場合は100%とする
  const matchPercentage =
    requiredSkills.length === 0 ? 100 : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    extraSkills,
  };
}

/**
 * マッチ率に応じた色クラスを取得
 */
function getMatchColor(percentage: number): string {
  if (percentage >= 80) return 'text-success';
  if (percentage >= 50) return 'text-warning';
  return 'text-error';
}

/**
 * マッチ率に応じたプログレスバーの色クラスを取得
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'progress-success';
  if (percentage >= 50) return 'progress-warning';
  return 'progress-error';
}

/**
 * メンバー追加モーダル
 * - サーバーサイド検索（デバウンス付き）
 * - ロール選択
 * - スキルマッチング表示（オプション）
 * - 追加確認
 */
export default function AddMemberModal({
  isOpen,
  existingMembers,
  onClose,
  onConfirm,
  showSkillMatching = false,
  requiredSkills = [],
}: AddMemberModalProps) {
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

  // スキルマッチング結果を計算
  const skillMatchResult = useMemo(() => {
    if (!showSkillMatching || !selectedUser) return null;

    // ユーザーのスキルを SkillItem 形式に変換
    const userSkills: SkillItem[] = (selectedUser.skills || []).map((s) => ({
      id: s.id!,
      name: s.name!,
    }));

    return calculateSkillMatch(requiredSkills, userSkills);
  }, [showSkillMatching, selectedUser, requiredSkills]);

  // デバウンス付き検索
  const performSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

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
        {/* 選択済みユーザー表示 */}
        {selectedUser ? (
          <div className="bg-base-200 rounded-lg p-4 my-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getDisplayIconUrl(selectedUser.identityIconUrl)}
                  alt={selectedUser.username || 'User Avatar'}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <p className="font-semibold">{selectedUser.username}</p>
                  <p className="text-sm text-base-content/70">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-circle"
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

            {/* スキルマッチング表示 */}
            {showSkillMatching && skillMatchResult && requiredSkills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-base-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">スキルマッチング</span>
                  <span className={`text-lg font-bold ${getMatchColor(skillMatchResult.matchPercentage)}`}>
                    {skillMatchResult.matchPercentage}%
                  </span>
                </div>

                {/* プログレスバー */}
                <progress
                  className={`progress ${getProgressColor(skillMatchResult.matchPercentage)} w-full h-2`}
                  value={skillMatchResult.matchPercentage}
                  max="100"
                />

                {/* マッチしたスキル */}
                {skillMatchResult.matchedSkills.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1 text-xs text-success mb-1">
                      <CheckCircleIcon className="w-3 h-3" />
                      <span>マッチしたスキル ({skillMatchResult.matchedSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skillMatchResult.matchedSkills.map((skill) => (
                        <span key={skill.id} className="badge badge-success badge-sm">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 不足しているスキル */}
                {skillMatchResult.missingSkills.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1 text-xs text-error mb-1">
                      <HighlightOffIcon className="w-3 h-3" />
                      <span>不足しているスキル ({skillMatchResult.missingSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skillMatchResult.missingSkills.map((skill) => (
                        <span key={skill.id} className="badge badge-error badge-outline badge-sm">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ユーザーの追加スキル */}
                {skillMatchResult.extraSkills.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-base-content/60 mb-1">
                      その他のスキル ({skillMatchResult.extraSkills.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skillMatchResult.extraSkills.map((skill) => (
                        <span key={skill.id} className="badge badge-soft badge-accent badge-sm">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* スキルマッチング: 必須スキルが設定されていない場合 */}
            {showSkillMatching && requiredSkills.length === 0 && (
              <div className="mt-4 pt-4 border-t border-base-300">
                <div className="text-sm text-base-content/60 italic">
                  このワークスペースには必要スキルが設定されていません
                </div>
                {/* ユーザーのスキルを表示 */}
                {selectedUser.skills && selectedUser.skills.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-base-content/60 mb-1">ユーザーのスキル</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.skills.map((skill) => (
                        <span key={skill.id} className="badge badge-accent badge-sm">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
              <DebouncedSearchInput
                onSearch={performSearch}
                placeholder="名前、メールアドレス、またはスキルで検索..."
                debounceMs={300}
                size="md"
                isLoading={isSearching}
              />
              <div className="label">
                <span className="label-text-alt text-base-content/60">
                  2文字以上入力すると検索します（スキル名でも検索できます）
                </span>
              </div>
            </div>

            {/* 検索結果一覧 */}
            <div className="flex-1 overflow-y-auto border border-base-300 rounded-lg min-h-[200px] max-h-[300px]">
              {!searchQuery.trim() ? (
                <div className="flex items-center justify-center h-full text-base-content/50">
                  名前、メールアドレス、またはスキル名を入力してください
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
                        className="w-full flex items-start gap-3 p-3 hover:bg-base-200 transition-colors text-left"
                        onClick={() => handleSelectUser(user)}
                      >
                        {/* アバター */}
                        <img
                          src={getDisplayIconUrl(user.identityIconUrl)}
                          alt={user.username || 'User Avatar'}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5"
                        />

                        {/* ユーザー情報 */}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{user.username || '(名前なし)'}</p>
                          <p className="text-sm text-base-content/70 truncate">{user.email}</p>
                          {/* スキル表示 */}
                          {user.skills && user.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {user.skills.slice(0, 5).map((skill) => (
                                <span key={skill.id} className="badge badge-accent badge-xs">
                                  {skill.name}
                                </span>
                              ))}
                              {user.skills.length > 5 && (
                                <span className="badge badge-soft badge-accent badge-xs">
                                  +{user.skills.length - 5}
                                </span>
                              )}
                            </div>
                          )}
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

        {/* ボタン */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-base-300">
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isAdding}>
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
