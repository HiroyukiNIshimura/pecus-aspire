'use client';

import { useEffect, useRef, useState } from 'react';
import type { MemberItem } from '@/components/workspaces/WorkspaceMemberList';
import type { WorkspaceRole } from '@/connectors/api/pecus';
import { getDisplayIconUrl } from '@/utils/imageUrl';

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

/**
 * メンバーカードコンポーネントのProps
 */
export interface MemberCardProps {
  member: MemberItem;
  editable: boolean;
  /** このメンバーがワークスペース作成者（スペシャルオーナー）かどうか */
  isWorkspaceOwner: boolean;
  onRemove?: (userId: number, userName: string) => void;
  onChangeRole?: (userId: number, userName: string, newRole: WorkspaceRole) => void;
  /** ハイライト表示（新規追加時） */
  isHighlighted?: boolean;
  /** アイコンクリック時のコールバック */
  onIconClick?: (userId: number, userName: string) => void;
  /** メンバー名クリック時のコールバック */
  onNameClick?: (userId: number, userName: string) => void;
}

/**
 * メンバーカードコンポーネント
 */
export default function MemberCard({
  member,
  editable,
  isWorkspaceOwner,
  onRemove,
  onChangeRole,
  isHighlighted = false,
  onIconClick,
  onNameClick,
}: MemberCardProps) {
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
      {onIconClick ? (
        <button
          type="button"
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full"
          onClick={() => onIconClick(memberId, memberName)}
          aria-label={`${memberName}のプロフィールを表示`}
        >
          {member.identityIconUrl ? (
            <img
              src={getDisplayIconUrl(member.identityIconUrl)}
              alt={memberName || 'ユーザー'}
              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center cursor-pointer hover:bg-base-200 transition-colors">
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
        </button>
      ) : member.identityIconUrl ? (
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
        {onNameClick ? (
          <button
            type="button"
            className="text-sm font-semibold truncate text-left hover:text-primary hover:underline transition-colors focus:outline-none focus:text-primary"
            onClick={() => onNameClick(memberId, memberName)}
          >
            {memberName}
          </button>
        ) : (
          <p className="text-sm font-semibold truncate">{memberName}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {/* ロールバッジ（ワークスペース作成者は星マークを表示） */}
          {isWorkspaceOwner ? (
            <div className="indicator">
              <span className="indicator-item indicator-end bg-warning size-3 rounded-full flex items-center justify-center">
                <span className="icon-[mdi--star] size-3 text-warning-content" aria-hidden="true" />
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
