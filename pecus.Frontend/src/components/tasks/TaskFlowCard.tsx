'use client';

import UserAvatar from '@/components/common/UserAvatar';
import type { TaskFlowNode, TaskPriority } from '@/connectors/api/pecus';

interface TaskFlowCardProps {
  task: TaskFlowNode;
  /** クリック可能か */
  clickable?: boolean;
  /** クリック時のコールバック */
  onClick?: () => void;
}

/**
 * 優先度のバッジを取得
 */
function getPriorityBadge(priority?: TaskPriority | null) {
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
function getTaskTypeIconPath(task: TaskFlowNode) {
  if (task.taskTypeIcon) {
    const iconName = task.taskTypeIcon.replace(/-/g, '').toLowerCase();
    return `/icons/task/${iconName}.svg`;
  }
  return null;
}

/**
 * ステータスアイコンを取得
 */
function getStatusIcon(task: TaskFlowNode) {
  if (task.isCompleted) {
    return {
      icon: 'icon-[mdi--check-circle]',
      className: 'text-success',
      label: '完了',
    };
  }
  if (task.isDiscarded) {
    return {
      icon: 'icon-[mdi--close-circle]',
      className: 'text-base-content/40',
      label: '破棄',
    };
  }
  if (!task.canStart) {
    return {
      icon: 'icon-[mdi--pause-circle]',
      className: 'text-warning',
      label: '待機中',
    };
  }
  if (task.progressPercentage > 0) {
    return {
      icon: 'icon-[mdi--progress-clock]',
      className: 'text-info',
      label: '進行中',
    };
  }
  return {
    icon: 'icon-[mdi--play-circle]',
    className: 'text-success',
    label: '着手可能',
  };
}

/**
 * タスクフローマップのタスクカード
 */
export default function TaskFlowCard({ task, clickable = false, onClick }: TaskFlowCardProps) {
  const status = getStatusIcon(task);
  const iconPath = getTaskTypeIconPath(task);
  const isInactive = task.isCompleted || task.isDiscarded;

  // 完了/破棄されたタスクにはblurを適用（タスク一覧と同じ仕様）
  const blurClass = isInactive ? 'blur-[1px] opacity-60 hover:blur-none hover:opacity-100' : '';
  const clickableClass = clickable ? 'cursor-pointer hover:border-primary hover:shadow-md' : '';

  return (
    <div
      className={`rounded-lg bg-base-100 border border-base-content/25 shadow-sm transition-all ${
        !task.canStart && !isInactive ? 'border-l-4 border-l-warning' : ''
      } ${task.successorCount > 0 && task.canStart && !isInactive ? 'border-l-4 border-l-error' : ''} ${blurClass} ${clickableClass}`}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="p-2 flex flex-col gap-1.5">
        {/* ヘッダー: ステータス・バッジ */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className={`${status.icon} w-4 h-4 ${status.className}`} aria-label={status.label} />
            {task.taskTypeId && iconPath && (
              <img src={iconPath} alt={task.taskTypeName || ''} className="w-4 h-4 rounded" />
            )}
            <span className="font-mono text-xs text-base-content/60">T-{task.sequence}</span>
          </div>
          <div className="flex gap-0.5">
            {task.successorCount > 0 && (
              <span className="badge badge-error badge-xs gap-0.5" title={`${task.successorCount}タスクが待機中`}>
                <span className="icon-[mdi--link-variant] w-2.5 h-2.5" aria-hidden="true" />
                {task.successorCount}
              </span>
            )}
            {getPriorityBadge(task.priority)}
          </div>
        </div>

        {/* タスク内容 */}
        <p className="text-xs line-clamp-2 leading-tight" title={task.content}>
          {task.content}
        </p>

        {/* 進捗バー */}
        <progress
          className={`progress w-full h-1 ${
            task.isCompleted
              ? 'progress-success'
              : task.progressPercentage > 0
                ? 'progress-primary'
                : 'progress-secondary'
          }`}
          value={task.progressPercentage}
          max="100"
        />

        {/* フッター: 担当者 */}
        <div className="flex items-center justify-between text-xs text-base-content/60">
          {task.assignedUserId ? (
            <UserAvatar
              userName={task.assignedUsername}
              identityIconUrl={task.assignedAvatarUrl}
              size={14}
              nameClassName="text-xs truncate max-w-[60px]"
            />
          ) : (
            <span className="text-base-content/30 text-xs">未割当</span>
          )}
          {task.dueDate && (
            <span className="text-xs">
              {new Date(task.dueDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
