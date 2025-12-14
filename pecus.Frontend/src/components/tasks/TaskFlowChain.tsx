'use client';

import type { TaskFlowNode } from '@/connectors/api/pecus';
import TaskFlowCard from './TaskFlowCard';

interface TaskFlowChainProps {
  /** チェーン内のタスク一覧（依存順） */
  tasks: TaskFlowNode[];
  /** タスクカードクリック時のコールバック */
  onTaskClick?: (task: TaskFlowNode) => void;
  /** カードをクリック可能にするか */
  clickable?: boolean;
}

/**
 * タスクフローマップのチェーン表示
 * タスクを縦に並べて矢印でつなぐ
 */
export default function TaskFlowChain({ tasks, onTaskClick, clickable = false }: TaskFlowChainProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      {tasks.map((task, index) => (
        <div key={task.id} className="w-full max-w-md">
          {/* 矢印コネクタ（最初のタスク以外） */}
          {index > 0 && (
            <div className="flex flex-col items-center py-1">
              <div className="w-0.5 h-3 bg-base-300" />
              <span className="icon-[mdi--chevron-down] w-5 h-5 text-base-300 -my-1" aria-hidden="true" />
            </div>
          )}

          {/* タスクカード */}
          <TaskFlowCard task={task} clickable={clickable} onClick={() => onTaskClick?.(task)} />
        </div>
      ))}
    </div>
  );
}
