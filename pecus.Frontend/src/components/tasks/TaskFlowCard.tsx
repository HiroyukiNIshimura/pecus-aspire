'use client';

import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { TaskFlowNode, TaskPriority } from '@/connectors/api/pecus';
import { formatShortDate } from '@/libs/utils/date';

interface TaskFlowCardProps {
  task: TaskFlowNode;
  /** クリック可能か */
  clickable?: boolean;
  /** クリック時のコールバック */
  onClick?: () => void;
}

/**
 * 期限の緊急度を取得
 */
function getDueDateUrgency(dueDate: string | null | undefined): {
  className: string;
  iconClassName: string;
  isUrgent: boolean;
} {
  if (!dueDate) {
    return { className: 'text-base-content/60', iconClassName: 'text-base-content/40', isUrgent: false };
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // 期限切れ
    return { className: 'text-error font-semibold', iconClassName: 'text-error', isUrgent: true };
  }
  if (diffDays <= 3) {
    // 3日以内
    return { className: 'text-warning font-semibold', iconClassName: 'text-warning', isUrgent: true };
  }
  if (diffDays <= 7) {
    // 7日以内
    return { className: 'text-info', iconClassName: 'text-info', isUrgent: false };
  }
  // それ以外
  return { className: 'text-base-content/60', iconClassName: 'text-base-content/40', isUrgent: false };
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
      className={`rounded-lg bg-base-100 border border-base-content/25 shadow-sm transition-all h-full ${
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
      <div className="p-2 flex flex-col gap-1.5 h-full">
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
        <p className="text-xs line-clamp-2 leading-tight flex-1" title={task.content}>
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

        {/* フッター: 担当者/完了者・期限 */}
        <div className="flex items-center justify-between text-xs text-base-content/60 mt-auto">
          {task.isCompleted && task.completedBy?.id ? (
            <div className="flex items-center gap-0.5">
              <span className="icon-[mdi--check-circle] w-3 h-3 text-success flex-shrink-0" aria-hidden="true" />
              <UserAvatar
                userName={task.completedBy.username}
                isActive={task.completedBy.isActive ?? false}
                identityIconUrl={task.completedBy.identityIconUrl}
                size={14}
                nameClassName="text-xs truncate max-w-[60px] text-success"
              />
            </div>
          ) : task.assigned?.id ? (
            <UserAvatar
              userName={task.assigned.username}
              isActive={task.assigned.isActive ?? false}
              identityIconUrl={task.assigned.identityIconUrl}
              size={14}
              nameClassName="text-xs truncate max-w-[60px]"
            />
          ) : (
            <span className="text-base-content/30 text-xs">未割当</span>
          )}
          <div className="flex items-center gap-1">
            {task.hasDueDateConflict && (
              <span
                className="icon-[mdi--alert] w-4 h-4 text-warning"
                aria-label="先行タスクより期限が早い"
                title="先行タスクの期限日より早い期限が設定されています"
              />
            )}
            {task.dueDate &&
              (() => {
                const urgency = getDueDateUrgency(task.dueDate);
                return (
                  <span className={`flex items-center gap-0.5 text-sm ${urgency.className}`}>
                    <span className={`icon-[mdi--calendar] w-3.5 h-3.5 ${urgency.iconClassName}`} aria-hidden="true" />
                    {formatShortDate(task.dueDate)}
                  </span>
                );
              })()}
          </div>
        </div>
      </div>
    </div>
  );
}
