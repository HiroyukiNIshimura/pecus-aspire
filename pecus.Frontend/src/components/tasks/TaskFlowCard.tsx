'use client';

import UserAvatar from '@/components/common/UserAvatar';
import type { TaskFlowNode, TaskPriority } from '@/connectors/api/pecus';

interface TaskFlowCardProps {
  task: TaskFlowNode;
  /** クリック可能か */
  clickable?: boolean;
  /** クリック時のコールバック */
  onClick?: () => void;
  /** コンパクト表示モード（水平フロー用） */
  compact?: boolean;
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
 * 期限バッジを取得
 */
function getDueDateBadge(dueDate?: string | null) {
  if (!dueDate) return null;

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

  return (
    <span className="badge badge-xs badge-secondary">
      {due.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
    </span>
  );
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
export default function TaskFlowCard({ task, clickable = false, onClick, compact = false }: TaskFlowCardProps) {
  const status = getStatusIcon(task);
  const iconPath = getTaskTypeIconPath(task);
  const isInactive = task.isCompleted || task.isDiscarded;

  // コンパクトモード用のカード
  if (compact) {
    return (
      <div
        className={`card bg-base-100 border border-base-300 transition-all ${
          isInactive ? 'opacity-60' : ''
        } ${!task.canStart && !isInactive ? 'border-l-4 border-l-warning' : ''} ${
          task.successorCount > 0 && task.canStart && !isInactive ? 'border-l-4 border-l-error' : ''
        } ${clickable ? 'cursor-pointer hover:border-primary hover:shadow-md' : 'blur-[1px] opacity-60 hover:blur-none hover:opacity-100'}`}
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
        <div className="card-body p-2 gap-1.5">
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

  return (
    <div
      className={`card bg-base-100 border border-base-300 transition-all ${
        isInactive ? 'opacity-60' : ''
      } ${!task.canStart && !isInactive ? 'border-l-4 border-l-warning' : ''} ${
        task.successorCount > 0 && task.canStart && !isInactive ? 'border-l-4 border-l-error' : ''
      } ${clickable ? 'cursor-pointer hover:border-primary hover:shadow-md' : 'blur-[1px] opacity-60 hover:blur-none hover:opacity-100'}`}
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
      <div className="card-body p-3 gap-2">
        {/* 待機中の場合は先行タスク情報を表示 */}
        {!task.canStart && !isInactive && task.predecessorTask && (
          <div className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-1 rounded -mt-1 -mx-1">
            <span className="icon-[mdi--pause-circle-outline] w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">
              待機: T-{task.predecessorTask.sequence ?? '?'} {task.predecessorTask.content}
            </span>
          </div>
        )}

        {/* ヘッダー: ステータス・タスクタイプアイコン・バッジ */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* ステータスアイコン */}
            <span className={`${status.icon} w-5 h-5 ${status.className}`} aria-label={status.label} />

            {/* タスクタイプアイコン */}
            {task.taskTypeId && iconPath && (
              <img
                src={iconPath}
                alt={task.taskTypeName || ''}
                className="w-5 h-5 rounded"
                title={task.taskTypeName || ''}
              />
            )}
          </div>

          {/* バッジ群 */}
          <div className="flex flex-wrap gap-1 justify-end">
            {/* 後続タスク数 */}
            {task.successorCount > 0 && (
              <span
                className="badge badge-error badge-xs gap-0.5"
                title={`${task.successorCount}タスクがこのタスクを待っています`}
              >
                <span className="icon-[mdi--link-variant] w-3 h-3" aria-hidden="true" />
                {task.successorCount}
              </span>
            )}

            {/* 完了・破棄バッジ */}
            {task.isCompleted && <span className="badge badge-success badge-xs">完了</span>}
            {task.isDiscarded && <span className="badge badge-neutral badge-xs">破棄</span>}

            {/* 優先度バッジ */}
            {getPriorityBadge(task.priority)}

            {/* 期限バッジ */}
            {!isInactive && getDueDateBadge(task.dueDate)}
          </div>
        </div>

        {/* タスク内容 */}
        <p className="text-sm line-clamp-2" title={`T-${task.sequence} ${task.content}`}>
          <span className="font-mono text-xs text-base-content/60 mr-1">T-{task.sequence}</span>
          {task.content}
        </p>

        {/* 進捗バー */}
        <div className="w-full">
          <progress
            className={`progress w-full h-1.5 ${
              task.isCompleted
                ? 'progress-success'
                : task.progressPercentage > 0
                  ? 'progress-primary'
                  : 'progress-secondary'
            }`}
            value={task.progressPercentage}
            max="100"
          />
        </div>

        {/* フッター: 担当者・期限 */}
        <div className="flex items-center justify-between gap-2 text-xs text-base-content/60">
          <div className="flex items-center gap-1.5">
            {task.assignedUserId ? (
              <UserAvatar
                userName={task.assignedUsername}
                identityIconUrl={task.assignedAvatarUrl}
                size={16}
                nameClassName="text-xs truncate max-w-[80px]"
              />
            ) : (
              <span className="text-base-content/30">—</span>
            )}
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1">
              <span className="icon-[mdi--calendar] w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {new Date(task.dueDate).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
