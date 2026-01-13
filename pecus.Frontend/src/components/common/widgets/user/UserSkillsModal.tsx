'use client';

import { useEffect, useState } from 'react';
import { getUserSkills } from '@/actions/user';
import type { UserSkillDetailResponse } from '@/connectors/api/pecus';

/**
 * ユーザースキルモーダルのProps
 */
export interface UserSkillsModalProps {
  /** モーダル表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 対象ユーザーID */
  userId: number;
  /** 対象ユーザー名 */
  userName: string;
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
 * ユーザースキル表示モーダル
 * - 指定ユーザーのスキル一覧を表示
 * - スキル名、説明、追加日を表示
 */
export default function UserSkillsModal({ isOpen, onClose, userId, userName }: UserSkillsModalProps) {
  const [skills, setSkills] = useState<UserSkillDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダル表示時にデータ取得
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

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="icon-[mdi--lightning-bolt] size-5 text-warning" aria-hidden="true" />
            {userName}のスキル
          </h2>
          <button type="button" className="btn btn-sm btn-circle btn-secondary" onClick={onClose} aria-label="閉じる">
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}

          {error && (
            <div className="alert alert-soft alert-error">
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && skills.length === 0 && (
            <div className="text-center py-8 text-base-content/60">
              <span className="icon-[mdi--lightning-bolt-outline] size-12 mx-auto mb-2 block" aria-hidden="true" />
              <p>スキルはまだ登録されていません</p>
            </div>
          )}

          {!isLoading && !error && skills.length > 0 && (
            <ul className="space-y-3">
              {skills.map((skill) => (
                <li key={skill.id} className="p-3 bg-base-200 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{skill.name}</p>
                      {skill.description && <p className="text-sm text-base-content/70 mt-1">{skill.description}</p>}
                    </div>
                    <span className="text-xs text-base-content/50 whitespace-nowrap">{formatDate(skill.addedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end p-4 border-t border-base-300 shrink-0">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
