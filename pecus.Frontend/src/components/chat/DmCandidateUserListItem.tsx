'use client';

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { DmCandidateUserItem } from '@/connectors/api/pecus';

interface DmCandidateUserListItemProps {
  user: DmCandidateUserItem;
  onClick: () => void;
  loading?: boolean;
}

/**
 * DM候補ユーザー一覧アイテム
 * 「他のメンバー」セクションに表示するユーザー
 */
export default function DmCandidateUserListItem({ user, onClick, loading = false }: DmCandidateUserListItemProps) {
  // 最終アクティブ日時のフォーマット
  const lastActiveText = user.lastActiveAt
    ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true, locale: ja })
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-base-200 transition-colors text-left disabled:opacity-50"
    >
      {/* アバター */}
      <div className="relative shrink-0">
        {user.identityIconUrl ? (
          <img src={user.identityIconUrl} alt="" className="size-10 rounded-full object-cover" />
        ) : (
          <div className="size-10 rounded-full bg-base-300 flex items-center justify-center">
            <span className="icon-[tabler--user] size-5 text-base-content/50" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* ユーザー情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{user.username}</span>
          {lastActiveText && <span className="text-xs text-base-content/50 shrink-0">{lastActiveText}</span>}
        </div>
      </div>

      {/* ローディング */}
      {loading && <span className="loading loading-spinner loading-xs" />}
    </button>
  );
}
