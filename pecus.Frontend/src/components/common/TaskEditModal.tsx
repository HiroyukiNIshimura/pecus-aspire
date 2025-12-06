'use client';

import WorkspaceTaskEditModal, { type WorkspaceTaskEditModalProps } from './WorkspaceTaskEditModal';

export interface TaskEditModalProps
  extends Omit<WorkspaceTaskEditModalProps, 'initialNavigation' | 'pageSize' | 'taskId'> {
  /** 編集対象のタスクID（必須） */
  taskId: number;
}

/**
 * 既存の TaskEditModal API を維持しつつ、共通実装（WorkspaceTaskEditModal）に委譲するラッパー。
 * ナビゲーション機能を持たない単一タスク編集用のシンプルバリアント。
 */
export default function TaskEditModal({ taskId, ...props }: TaskEditModalProps) {
  return (
    <WorkspaceTaskEditModal
      {...props}
      taskId={taskId}
      initialNavigation={null}
      pageSize={10}
      initialFocusComments={props.initialFocusComments ?? false}
      showNavigationControls={false}
    />
  );
}
