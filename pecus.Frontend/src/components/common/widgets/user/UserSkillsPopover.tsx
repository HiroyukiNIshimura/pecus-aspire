'use client';

import { useEffect, useRef, useState } from 'react';
import { getUserSkills } from '@/actions/user';
import type { UserSkillDetailResponse } from '@/connectors/api/pecus';

/**
 * ユーザースキルポップオーバーのProps
 */
export interface UserSkillsPopoverProps {
  /** ポップオーバー表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 対象ユーザーID */
  userId: number;
  /** 対象ユーザー名 */
  userName: string;
  /** アンカー要素の位置情報 */
  anchorRect?: DOMRect | null;
}

/**
 * 日付をフォーマット（YYYY/MM/DD）
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * ユーザースキル表示ポップオーバー
 * - 指定ユーザーのスキル一覧をポップオーバーで表示
 * - スキル名、説明、追加日を表示
 */
export default function UserSkillsPopover({ isOpen, onClose, userId, userName, anchorRect }: UserSkillsPopoverProps) {
  const [skills, setSkills] = useState<UserSkillDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // ポップオーバー表示時にデータ取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchSkills = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getUserSkills(userId);
      if (result.success) {
        setSkills(result.data);
      } else {
        setError(result.message ?? 'スキルの取得に失敗しました');
      }
      setIsLoading(false);
    };

    fetchSkills();
  }, [isOpen, userId]);

  // 外部クリックで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // 少し遅延させてクリックイベントを登録（トリガー要素のクリックを無視するため）
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ポップオーバーの位置計算
  const getPopoverStyle = (): React.CSSProperties => {
    if (!anchorRect) {
      // アンカーがない場合は画面中央
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const popoverWidth = 360;
    const popoverHeight = 320;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // デフォルトは下に表示
    let top = anchorRect.bottom + margin;
    let left = anchorRect.left;

    // 右端からはみ出す場合は左にずらす
    if (left + popoverWidth > viewportWidth - margin) {
      left = viewportWidth - popoverWidth - margin;
    }

    // 左端からはみ出す場合
    if (left < margin) {
      left = margin;
    }

    // 下にスペースがない場合は上に表示
    if (top + popoverHeight > viewportHeight - margin) {
      top = anchorRect.top - popoverHeight - margin;
    }

    // 上にもスペースがない場合は画面内に収める
    if (top < margin) {
      top = margin;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  return (
    <>
      {/* オーバーレイ（薄い背景） */}
      <div className="fixed inset-0 z-40 bg-black/20" aria-hidden="true" />

      {/* ポップオーバー本体 */}
      <div
        ref={popoverRef}
        className="z-50 bg-base-100 rounded-box shadow-xl w-90 max-h-[60vh] flex flex-col border border-base-300"
        style={getPopoverStyle()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-skills-title"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 border-b border-base-300 shrink-0">
          <h2 id="user-skills-title" className="text-base font-bold flex items-center gap-2">
            <span className="icon-[mdi--lightning-bolt] size-5 text-warning" aria-hidden="true" />
            {userName}のスキル
          </h2>
          <button type="button" className="btn btn-xs btn-circle btn-secondary" onClick={onClose} aria-label="閉じる">
            <span className="icon-[mdi--close] size-4" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading && (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}

          {error && (
            <div className="alert alert-soft alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && skills.length === 0 && (
            <div className="text-center py-6 text-base-content/60">
              <span className="icon-[mdi--lightning-bolt-outline] size-10 mx-auto mb-2 block" aria-hidden="true" />
              <p className="text-sm">スキルはまだ登録されていません</p>
            </div>
          )}

          {!isLoading && !error && skills.length > 0 && (
            <ul className="space-y-2">
              {skills.map((skill) => (
                <li key={skill.id} className="p-2.5 bg-base-200 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{skill.name}</p>
                      {skill.description && (
                        <p className="text-xs text-base-content/70 mt-0.5 line-clamp-2">{skill.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-base-content/50 whitespace-nowrap">{formatDate(skill.addedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* フッター（スキル数表示） */}
        {!isLoading && !error && skills.length > 0 && (
          <div className="flex justify-center p-2 border-t border-base-300 shrink-0 text-xs text-base-content/60">
            {skills.length}個のスキル
          </div>
        )}
      </div>
    </>
  );
}
