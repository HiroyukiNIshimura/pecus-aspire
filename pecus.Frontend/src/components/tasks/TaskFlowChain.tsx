'use client';

import type { TaskFlowNode } from '@/connectors/api/pecus';
import TaskFlowCard from './TaskFlowCard';

interface TaskFlowChainProps {
  /** チェーン内のタスク一覧（依存順） */
  tasks: TaskFlowNode[];
  /** タスクカードクリック時のコールバック */
  onTaskClick?: (task: TaskFlowNode) => void;
  /** タスクごとにクリック可能かどうかを判断する関数 */
  canEditTask?: (task: TaskFlowNode) => boolean;
}

/**
 * タスクフローマップのチェーン表示
 * タスクを横に並べて矢印でつなぐ（左から右へ流れる）
 */
export default function TaskFlowChain({ tasks, onTaskClick, canEditTask }: TaskFlowChainProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="flex items-center gap-1 py-2">
      {tasks.map((task, index) => {
        const clickable = canEditTask?.(task) ?? false;
        return (
          <div key={task.id} className="flex items-center">
            {/* 矢印コネクタ（最初のタスク以外） */}
            {index > 0 && (
              <div className="flex items-center px-1 flex-shrink-0">
                <svg
                  width="32"
                  height="20"
                  viewBox="0 0 32 20"
                  fill="none"
                  className="text-base-content/50"
                  aria-hidden="true"
                >
                  <line x1="0" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="2" />
                  <polygon points="32,10 24,5 24,15" fill="currentColor" />
                </svg>
              </div>
            )}

            {/* タスクカード */}
            <div className="w-48 flex-shrink-0">
              <TaskFlowCard
                task={task}
                clickable={clickable}
                onClick={clickable ? () => onTaskClick?.(task) : undefined}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
