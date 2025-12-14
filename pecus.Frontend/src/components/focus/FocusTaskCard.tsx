'use client';

import Link from 'next/link';
import type { FocusTaskResponse } from '@/connectors/api/pecus';

interface FocusTaskCardProps {
  task: FocusTaskResponse;
}

/**
 * 優先度のバッジを取得
 */
function getPriorityBadge(priority?: string | null) {
  if (!priority) return null;

  const badges: Record<string, { label: string; className: string }> = {
    Critical: { label: '緊急', className: 'badge-error' },
    High: { label: '高', className: 'badge-warning' },
    Medium: { label: '中', className: 'badge-info' },
    Low: { label: '低', className: 'badge-secondary' },
  };

  const badge = badges[priority];
  if (!badge) return null;

  return <span className={`badge badge-xs ${badge.className}`}>{badge.label}</span>;
}

/**
 * 期限までの残り時間を計算してバッジを返す
 */
function getDueDateBadge(dueDate: string) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) {
    return <span className="badge badge-xs badge-error">期限切れ</span>;
  }
  if (diffHours <= 24) {
    return <span className="badge badge-xs badge-error">今日まで</span>;
  }
  if (diffHours <= 48) {
    return <span className="badge badge-xs badge-warning">明日まで</span>;
  }
  if (diffHours <= 72) {
    return <span className="badge badge-xs badge-warning">2-3日後</span>;
  }
  if (diffHours <= 168) {
    return <span className="badge badge-xs badge-info">今週中</span>;
  }

  return <span className="badge badge-xs badge-secondary">{due.toLocaleDateString('ja-JP')}</span>;
}

/**
 * フォーカス推奨タスクカード
 * 着手可能なタスクを表示
 */
export default function FocusTaskCard({ task }: FocusTaskCardProps) {
  const taskUrl = `/workspaces/${task.workspaceCode}?itemCode=${task.itemCode}`;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* ヘッダー: スコアとコード */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={taskUrl} className="text-sm font-medium text-primary hover:underline">
              {task.itemCode}
            </Link>
            {getPriorityBadge(task.priority)}
            {getDueDateBadge(task.dueDate)}
          </div>
          <div className="flex items-center gap-1 text-xs text-base-content/60">
            <span className="icon-[mdi--star] w-4 h-4 text-warning" aria-hidden="true" />
            <span className="font-semibold">{task.totalScore.toFixed(1)}</span>
          </div>
        </div>

        {/* タスク内容 */}
        <Link href={taskUrl} className="hover:text-primary transition-colors">
          <h3 className="text-base font-semibold mb-1 line-clamp-2">{task.content}</h3>
          {task.itemSubject && <p className="text-sm text-base-content/70 line-clamp-1 mb-2">{task.itemSubject}</p>}
        </Link>

        {/* メタ情報 */}
        <div className="flex items-center gap-4 text-xs text-base-content/60">
          {task.workspaceName && (
            <div className="flex items-center gap-1">
              <span className="icon-[mdi--folder-outline] w-4 h-4" aria-hidden="true" />
              <span>{task.workspaceName}</span>
            </div>
          )}
          {task.estimatedHours != null && (
            <div className="flex items-center gap-1">
              <span className="icon-[mdi--clock-outline] w-4 h-4" aria-hidden="true" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="icon-[mdi--progress-check] w-4 h-4" aria-hidden="true" />
            <span>{task.progressPercentage}%</span>
          </div>
        </div>

        {/* 後続タスク影響 */}
        {task.successorCount > 0 && (
          <div className="mt-3 p-2 bg-info/10 border border-info/30 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="icon-[mdi--link-variant] w-5 h-5 text-info flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <p className="font-semibold text-info mb-1">{task.successorCount}件のタスクがこれを待機中</p>
                <p className="text-base-content/70">
                  💡 このタスクを完了すると、{task.successorCount}件のタスクが着手可能になります
                </p>
              </div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="mt-3 flex justify-end">
          <Link href={taskUrl} className="btn btn-sm btn-primary">
            取り組む
            <span className="icon-[mdi--arrow-right] w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
