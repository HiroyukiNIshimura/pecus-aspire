'use client';

import { useEffect, useRef, useState } from 'react';
import type { WorkspaceRole } from '@/connectors/api/pecus';
import { getDisplayIconUrl } from '@/utils/imageUrl';

/**
 * メンバー情報の共通インターフェース
 * WorkspaceUserItem と WorkspaceDetailUserResponse の両方を受け入れ可能
 */
export interface MemberItem {
  /** ユーザーID (userId または id) */
  userId?: number;
  id?: number;
  /** ユーザー名 (username または userName) */
  username?: string;
  userName?: string | null;
  /** メールアドレス */
  email?: string | null;
  /** アイデンティティアイコンURL */
  identityIconUrl?: string | null;
  /** ワークスペースロール */
  workspaceRole?: WorkspaceRole;
  /** アクティブフラグ */
  isActive?: boolean;
}

/**
 * ロールの表示設定
 */
const roleConfig: Record<WorkspaceRole, { label: string; badgeClass: string; order: number }> = {
  Owner: { label: 'オーナー', badgeClass: 'badge-outline badge-warning', order: 0 },
  Member: { label: 'メンバー', badgeClass: 'badge-outline badge-success', order: 1 },
  Viewer: { label: '閲覧者', badgeClass: 'badge-outline badge-light', order: 2 },
};

/** ロール変更の選択肢 */
const roleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: 'Owner', label: 'オーナー' },
  { value: 'Member', label: 'メンバー' },
  { value: 'Viewer', label: '閲覧者' },
];

/** メンバー情報からユーザーIDを取得 */
const getMemberId = (member: MemberItem): number => member.userId ?? member.id ?? 0;

/** メンバー情報からユーザー名を取得 */
const getMemberName = (member: MemberItem): string => member.username ?? member.userName ?? '';

interface WorkspaceMemberListProps {
  /** メンバー一覧 */
  members: MemberItem[];
  /** 編集モード（メンバー追加/削除/ロール変更を許可） */
  editable?: boolean;
  /** ワークスペース作成者（オーナー）のユーザーID（この人は削除/ロール変更不可） */
  ownerId?: number;
  /** メンバー追加ボタンクリック時のコールバック */
  onAddMember?: () => void;
  /** メンバー削除ボタンクリック時のコールバック */
  onRemoveMember?: (userId: number, userName: string) => void;
  /** ロール変更時のコールバック */
  onChangeRole?: (userId: number, userName: string, newRole: WorkspaceRole) => void;
  /** ハイライト表示するユーザーIDのセット（新規追加時など） */
  highlightedUserIds?: Set<number>;
}

/**
 * ワークスペースメンバー一覧コンポーネント
 * - Owner → Member → Viewer の順にソート
 * - 編集モードでは3点メニューからロール変更・削除が可能
 */
export default function WorkspaceMemberList({
  members,
  editable = false,
  ownerId,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  highlightedUserIds,
}: WorkspaceMemberListProps) {
  // 権限の優先順位でソート
  const sortedMembers = [...members].sort((a, b) => {
    const orderA = roleConfig[a.workspaceRole || 'Viewer']?.order ?? 3;
    const orderB = roleConfig[b.workspaceRole || 'Viewer']?.order ?? 3;
    return orderA - orderB;
  });

  return (
    <div className="card">
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-lg">メンバー一覧</h2>
          {editable && onAddMember && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onAddMember}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              メンバー追加
            </button>
          )}
        </div>

        {/* メンバーが0件の場合 */}
        {members.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">メンバーが登録されていません</div>
        ) : (
          /* メンバーグリッド */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {sortedMembers.map((member) => (
              <WorkspaceMemberCard
                key={getMemberId(member)}
                member={member}
                editable={editable}
                isWorkspaceOwner={ownerId !== undefined && getMemberId(member) === ownerId}
                onRemove={onRemoveMember}
                onChangeRole={onChangeRole}
                isHighlighted={highlightedUserIds?.has(getMemberId(member)) ?? false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * メンバーカードコンポーネント
 */
interface WorkspaceMemberCardProps {
  member: MemberItem;
  editable: boolean;
  /** このメンバーがワークスペース作成者（スペシャルオーナー）かどうか */
  isWorkspaceOwner: boolean;
  onRemove?: (userId: number, userName: string) => void;
  onChangeRole?: (userId: number, userName: string, newRole: WorkspaceRole) => void;
  /** ハイライト表示（新規追加時） */
  isHighlighted?: boolean;
}

function WorkspaceMemberCard({
  member,
  editable,
  isWorkspaceOwner,
  onRemove,
  onChangeRole,
  isHighlighted = false,
}: WorkspaceMemberCardProps) {
  const memberId = getMemberId(member);
  const memberName = getMemberName(member);
  const config = roleConfig[member.workspaceRole || 'Viewer'] || roleConfig.Viewer;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleRoleChange = (newRole: WorkspaceRole) => {
    if (onChangeRole && memberId && newRole !== member.workspaceRole) {
      onChangeRole(memberId, memberName, newRole);
    }
    setIsMenuOpen(false);
  };

  const handleRemove = () => {
    if (onRemove && memberId) {
      onRemove(memberId, memberName);
    }
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded transition-all duration-500 ${
        isHighlighted ? 'bg-primary/20 ring-2 ring-primary ring-offset-1 animate-pulse' : 'bg-base-100'
      }`}
    >
      {/* アイコン */}
      {member.identityIconUrl ? (
        <img
          src={getDisplayIconUrl(member.identityIconUrl)}
          alt={memberName || 'ユーザー'}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-base-content/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}

      {/* ユーザー情報 */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{memberName}</p>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {/* ロールバッジ（ワークスペース作成者は星マークを表示） */}
          {isWorkspaceOwner ? (
            <div className="indicator">
              <span className="indicator-item indicator-end bg-warning size-3 rounded-full flex items-center justify-center">
                <span className="icon-[tabler--star-filled] text-warning-content size-2" />
              </span>
              <span className={`badge badge-xs ${config.badgeClass}`}>{config.label}</span>
            </div>
          ) : (
            <span className={`badge badge-xs ${config.badgeClass}`}>{config.label}</span>
          )}
          {/* 非アクティブ表示 */}
          {member.isActive === false && <span className="text-xs text-base-content/50">(非アクティブ)</span>}
        </div>
      </div>

      {/* 3点メニュー（ワークスペース作成者以外、編集モード時のみ） */}
      {editable && !isWorkspaceOwner && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="btn btn-xs btn-square"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={`${memberName}のメニューを開く`}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {/* ドロップダウンメニュー */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-base-100 rounded-lg shadow-lg border border-base-300">
              {/* ロール変更セクション */}
              <div className="px-3 py-2 border-b border-base-300">
                <p className="text-xs text-base-content/60 mb-1">ロールを変更</p>
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-base-200 flex items-center justify-between whitespace-nowrap ${
                      member.workspaceRole === option.value ? 'bg-base-200 font-medium' : ''
                    }`}
                    onClick={() => handleRoleChange(option.value)}
                  >
                    <span>{option.label}</span>
                    {member.workspaceRole === option.value && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* 削除アクション */}
              <div className="p-1">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 rounded flex items-center gap-2 whitespace-nowrap"
                  onClick={handleRemove}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  メンバーから削除
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
