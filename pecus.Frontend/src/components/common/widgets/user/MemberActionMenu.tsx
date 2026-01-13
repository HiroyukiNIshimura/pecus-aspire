'use client';

import { useEffect, useRef, useState } from 'react';
import type { WorkspaceRole } from '@/connectors/api/pecus';
import UserBadgesModal from './UserBadgesModal';
import UserSkillsModal from './UserSkillsModal';

/** ロール変更の選択肢 */
const roleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: 'Owner', label: 'オーナー' },
  { value: 'Member', label: 'メンバー' },
  { value: 'Viewer', label: '閲覧者' },
];

/**
 * メンバーアクションメニューのProps
 */
export interface MemberActionMenuProps {
  /** メンバーのユーザーID */
  userId: number;
  /** メンバーのユーザー名 */
  userName: string;
  /** 現在のロール */
  currentRole: WorkspaceRole;
  /** ロール変更時のコールバック */
  onChangeRole?: (userId: number, userName: string, newRole: WorkspaceRole) => void;
  /** メンバー削除時のコールバック */
  onRemove?: (userId: number, userName: string) => void;
}

/**
 * メンバーアクションメニュー（3点メニュー）
 * - スキル表示
 * - バッジ表示
 * - ロール変更
 * - メンバー削除
 */
export default function MemberActionMenu({
  userId,
  userName,
  currentRole,
  onChangeRole,
  onRemove,
}: MemberActionMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
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
    if (onChangeRole && newRole !== currentRole) {
      onChangeRole(userId, userName, newRole);
    }
    setIsMenuOpen(false);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(userId, userName);
    }
    setIsMenuOpen(false);
  };

  const handleViewSkills = () => {
    setIsMenuOpen(false);
    setIsSkillsModalOpen(true);
  };

  const handleViewBadges = () => {
    setIsMenuOpen(false);
    setIsBadgesModalOpen(true);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="btn btn-xs btn-secondary btn-square"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label={`${userName}のメニューを開く`}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        <span className="icon-[mdi--dots-vertical] size-4" aria-hidden="true" />
      </button>

      {/* ドロップダウンメニュー */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-base-100 rounded-lg shadow-lg border border-base-300">
          {/* スキル・バッジ表示セクション */}
          <div className="p-1 border-b border-base-300">
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-base-200 rounded flex items-center gap-2 whitespace-nowrap"
              onClick={handleViewSkills}
            >
              <span className="icon-[mdi--lightning-bolt] size-4 text-warning" aria-hidden="true" />
              スキルを見る
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-base-200 rounded flex items-center gap-2 whitespace-nowrap"
              onClick={handleViewBadges}
            >
              <span className="icon-[mdi--medal] size-4 text-warning" aria-hidden="true" />
              バッジを見る
            </button>
          </div>

          {/* ロール変更セクション */}
          <div className="px-3 py-2 border-b border-base-300">
            <p className="text-xs text-base-content/60 mb-1">ロールを変更</p>
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-base-200 flex items-center justify-between whitespace-nowrap ${
                  currentRole === option.value ? 'bg-base-200 font-medium' : ''
                }`}
                onClick={() => handleRoleChange(option.value)}
              >
                <span>{option.label}</span>
                {currentRole === option.value && (
                  <span className="icon-[mdi--check] size-4 text-success" aria-hidden="true" />
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
              <span className="icon-[mdi--delete-outline] size-4" aria-hidden="true" />
              メンバーから削除
            </button>
          </div>
        </div>
      )}

      {/* スキル表示モーダル */}
      <UserSkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        userId={userId}
        userName={userName}
      />

      {/* バッジ表示モーダル */}
      <UserBadgesModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
        userId={userId}
        userName={userName}
      />
    </div>
  );
}
