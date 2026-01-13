'use client';

import { useEffect, useRef, useState } from 'react';
import UserBadgesPopover from './UserBadgesPopover';
import UserSkillsPopover from './UserSkillsPopover';

/**
 * メンバー情報メニューのProps
 */
export interface MemberInfoMenuProps {
  /** メンバーのユーザーID */
  userId: number;
  /** メンバーのユーザー名 */
  userName: string;
}

/**
 * メンバー情報メニュー（情報アイコン）
 * - スキル表示
 * - バッジ表示
 * ※権限に関係なく誰でも使用可能
 */
export default function MemberInfoMenu({ userId, userName }: MemberInfoMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [skillsPopover, setSkillsPopover] = useState<{ anchorRect: DOMRect } | null>(null);
  const [badgesPopover, setBadgesPopover] = useState<{ anchorRect: DOMRect } | null>(null);
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

  const handleViewSkills = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setIsMenuOpen(false);
    setSkillsPopover({ anchorRect: rect });
  };

  const handleViewBadges = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setIsMenuOpen(false);
    setBadgesPopover({ anchorRect: rect });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="btn btn-xs btn-secondary btn-square"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label={`${userName}の情報を見る`}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        <span className="icon-[mdi--information-outline] size-4" aria-hidden="true" />
      </button>

      {/* ドロップダウンメニュー */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-40 bg-base-100 rounded-lg shadow-lg border border-base-300">
          <div className="p-1">
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
        </div>
      )}

      {/* スキル表示ポップオーバー */}
      <UserSkillsPopover
        isOpen={skillsPopover !== null}
        onClose={() => setSkillsPopover(null)}
        userId={userId}
        userName={userName}
        anchorRect={skillsPopover?.anchorRect}
      />

      {/* バッジ表示ポップオーバー */}
      <UserBadgesPopover
        isOpen={badgesPopover !== null}
        onClose={() => setBadgesPopover(null)}
        userId={userId}
        userName={userName}
        anchorRect={badgesPopover?.anchorRect}
      />
    </div>
  );
}
