'use client';

import { Handle, Position } from '@xyflow/react';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { TaskPriority } from '@/connectors/api/pecus';
import { formatShortDate } from '@/libs/utils/date';
import type { TaskNodeData } from './useTaskFlowGraph';
import { NODE_HEIGHT, NODE_WIDTH } from './useTaskFlowGraph';

/**
 * 期限の緊急度を取得
 */
function getDueDateUrgency(dueDate: string | null | undefined): {
  className: string;
  iconClassName: string;
} {
  if (!dueDate) {
    return { className: 'text-base-content/60', iconClassName: 'text-base-content/40' };
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { className: 'text-error font-semibold', iconClassName: 'text-error' };
  }
  if (diffDays <= 3) {
    return { className: 'text-warning font-semibold', iconClassName: 'text-warning' };
  }
  if (diffDays <= 7) {
    return { className: 'text-info', iconClassName: 'text-info' };
  }
  return { className: 'text-base-content/60', iconClassName: 'text-base-content/40' };
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
function getTaskTypeIconPath(taskTypeIcon?: string | null) {
  if (taskTypeIcon) {
    const iconName = taskTypeIcon.replace(/-/g, '').toLowerCase();
    return `/icons/task/${iconName}.svg`;
  }
  return null;
}

/**
 * ステータスアイコンを取得
 */
function getStatusIcon(task: TaskNodeData['task']) {
  if (task.isCompleted) {
    return { icon: 'icon-[mdi--check-circle]', className: 'text-success', label: '完了' };
  }
  if (task.isDiscarded) {
    return { icon: 'icon-[mdi--close-circle]', className: 'text-base-content/40', label: '破棄' };
  }
  if (!task.canStart) {
    return { icon: 'icon-[mdi--pause-circle]', className: 'text-warning', label: '待機中' };
  }
  if (task.progressPercentage > 0) {
    return { icon: 'icon-[mdi--progress-clock]', className: 'text-info', label: '進行中' };
  }
  return { icon: 'icon-[mdi--play-circle]', className: 'text-success', label: '着手可能' };
}

interface TaskFlowGraphNodeProps {
  data: TaskNodeData;
  selected?: boolean;
}

/**
 * DAGグラフ用のタスクノードコンポーネント
 * GitLab DAG風のノードデザイン
 */
export default function TaskFlowGraphNode({ data, selected }: TaskFlowGraphNodeProps) {
  const { task, isCriticalPath, isRoot, isLeaf, direction = 'LR' } = data;
  const status = getStatusIcon(task);
  const iconPath = getTaskTypeIconPath(task.taskTypeIcon);
  const isInactive = task.isCompleted || task.isDiscarded;

  // ボーダー色の決定
  const borderClass = isCriticalPath ? 'border-error' : selected ? 'border-primary' : 'border-base-content/25';

  // 左ボーダーアクセント
  const leftBorderClass =
    !task.canStart && !isInactive
      ? 'border-l-4 border-l-warning'
      : task.successorCount > 0 && task.canStart && !isInactive
        ? 'border-l-4 border-l-error'
        : '';

  return (
    <div
      className={`
        rounded-lg bg-base-100 border-2 shadow-md transition-all
        ${borderClass} ${leftBorderClass}
        ${isInactive ? 'opacity-60' : ''}
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      {/* 入力ハンドル（先行タスクからの接続点） */}
      {!isRoot && (
        <Handle
          type="target"
          position={direction === 'TB' ? Position.Top : Position.Left}
          isConnectable={false}
          style={{ width: 12, height: 12, background: '#d1d5db', border: '2px solid #9ca3af' }}
        />
      )}

      <div className="p-2 flex flex-col gap-1 h-full">
        {/* ヘッダー: ステータス・シーケンス・バッジ */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className={`${status.icon} w-4 h-4 ${status.className}`} aria-label={status.label} />
            {task.taskTypeId && iconPath && (
              <img src={iconPath} alt={task.taskTypeName || ''} className="w-4 h-4 rounded" />
            )}
            <span className="font-mono text-xs text-base-content/60 font-semibold">T-{task.sequence}</span>
          </div>
          <div className="flex gap-0.5 items-center">
            {isCriticalPath && <span className="icon-[mdi--fire] w-4 h-4 text-error" aria-label="クリティカルパス" />}
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

        {/* フッター: 担当者・期限 */}
        <div className="flex items-center justify-between text-xs text-base-content/60">
          {task.isCompleted && task.completedBy?.id ? (
            <div className="flex items-center gap-0.5">
              <span className="icon-[mdi--check-circle] w-3 h-3 text-success flex-shrink-0" aria-hidden="true" />
              <UserAvatar
                userName={task.completedBy.username}
                isActive={task.completedBy.isActive ?? false}
                identityIconUrl={task.completedBy.identityIconUrl}
                size={14}
                nameClassName="text-xs truncate max-w-[50px] text-success"
              />
            </div>
          ) : task.assigned?.id ? (
            <UserAvatar
              userName={task.assigned.username}
              isActive={task.assigned.isActive ?? false}
              identityIconUrl={task.assigned.identityIconUrl}
              size={14}
              nameClassName="text-xs truncate max-w-[50px]"
            />
          ) : (
            <span className="text-base-content/30 text-xs">未割当</span>
          )}
          <div className="flex items-center gap-1">
            {task.hasDueDateConflict && (
              <span
                className="icon-[mdi--alert] w-3.5 h-3.5 text-warning"
                aria-label="先行タスクより期限が早い"
                title="先行タスクの期限日より早い期限が設定されています"
              />
            )}
            {task.dueDate &&
              (() => {
                const urgency = getDueDateUrgency(task.dueDate);
                return (
                  <span className={`flex items-center gap-0.5 ${urgency.className}`}>
                    <span className={`icon-[mdi--calendar] w-3 h-3 ${urgency.iconClassName}`} aria-hidden="true" />
                    {formatShortDate(task.dueDate)}
                  </span>
                );
              })()}
          </div>
        </div>
      </div>

      {/* 出力ハンドル（後続タスクへの接続点） */}
      {!isLeaf && (
        <Handle
          type="source"
          position={direction === 'TB' ? Position.Bottom : Position.Right}
          isConnectable={false}
          style={{ width: 12, height: 12, background: '#d1d5db', border: '2px solid #9ca3af' }}
        />
      )}
    </div>
  );
}
