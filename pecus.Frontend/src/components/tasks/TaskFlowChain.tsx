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
 * タスクを縦に並べて矢印でつなぐ
 */
export default function TaskFlowChain({ tasks, onTaskClick, canEditTask }: TaskFlowChainProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      {tasks.map((task, index) => {
        const clickable = canEditTask?.(task) ?? false;
        return (
          <div key={task.id} className="w-full max-w-md">
            {/* 矢印コネクタ（最初のタスク以外） */}
            {index > 0 && (
              <div className="flex justify-center py-1">
                <svg
                  width="20"
                  height="24"
                  viewBox="0 0 20 24"
                  fill="none"
                  className="text-base-content"
                  aria-hidden="true"
                >
                  <line x1="10" y1="0" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
                  <polygon points="10,24 5,16 15,16" fill="currentColor" />
                </svg>
              </div>
            )}

            {/* タスクカード */}
            <TaskFlowCard
              task={task}
              clickable={clickable}
              onClick={clickable ? () => onTaskClick?.(task) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
