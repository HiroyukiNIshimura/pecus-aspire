'use client';

import Link from 'next/link';
import type { FocusTaskResponse } from '@/connectors/api/pecus';

interface WaitingTaskCardProps {
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
 * タスク種類アイコンのパスを取得
 */
function getTaskTypeIconPath(task: FocusTaskResponse) {
  if (task.taskTypeIcon) {
    const iconName = task.taskTypeIcon.replace(/-/g, '').toLowerCase();
    return `/icons/task/${iconName}.svg`;
  }
  if (task.taskTypeCode) {
    const iconName = task.taskTypeCode.replace(/-/g, '').toLowerCase();
    return `/icons/task/${iconName}.svg`;
  }
  return null;
}

/**
 * 待機中タスクカード
 * 先行タスクが未完了のため着手できないタスクを表示
 */
export default function WaitingTaskCard({ task }: WaitingTaskCardProps) {
  const taskUrl = `/workspaces/${task.workspaceCode}?itemCode=${task.itemCode}#tasks`;
  const predecessorUrl = task.predecessorTask
    ? `/workspaces/${task.workspaceCode}?itemCode=${task.predecessorTask.workspaceItemCode}`
    : null;

  return (
    <div className="card bg-base-100 border border-warning/30 shadow-sm opacity-75">
      <div className="card-body p-4">
        {/* ヘッダー: 待機アイコンとバッジ */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="icon-[mdi--pause-circle-outline] w-5 h-5 text-warning" aria-hidden="true" title="待機中" />
            {getPriorityBadge(task.priority)}
          </div>
        </div>

        {/* タスク内容 */}
        <Link href={taskUrl} className="group">
          <div className="flex items-start gap-2 mb-1">
            {task.taskTypeId && getTaskTypeIconPath(task) && (
              <img
                src={getTaskTypeIconPath(task) || undefined}
                alt={task.taskTypeName || ''}
                className="w-5 h-5 rounded flex-shrink-0 mt-0.5 opacity-70"
                title={task.taskTypeName || ''}
              />
            )}
            <h3 className="text-base font-semibold line-clamp-2 text-base-content/70 group-hover:text-primary transition-colors">
              {task.content}
            </h3>
          </div>
          {task.itemSubject && (
            <p className="text-sm text-base-content/60 line-clamp-1 mb-2">
              <span className="text-base-content/70 font-medium group-hover:text-primary transition-colors">
                #{task.itemCode}
              </span>{' '}
              {task.itemSubject}
            </p>
          )}
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
        </div>

        {/* 先行タスク情報 */}
        {task.predecessorTask && (
          <div className="mt-3 p-2 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-start gap-2">
              <span
                className="icon-[mdi--arrow-left-circle] w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="text-xs flex-1">
                <p className="font-semibold text-warning mb-1">先行タスクを完了してください</p>
                <div className="flex items-center gap-2 text-base-content/70">
                  {predecessorUrl ? (
                    <Link href={predecessorUrl} className="font-medium text-primary underline hover:text-primary/80">
                      {task.predecessorTask.workspaceItemCode}
                    </Link>
                  ) : (
                    <span className="font-medium">{task.predecessorTask.workspaceItemCode}</span>
                  )}
                  <span>「{task.predecessorTask.content}」</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
