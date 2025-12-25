'use client';

import { useEffect } from 'react';
import type { WorkspaceTaskDetailResponse } from '@/connectors/api/pecus';
import TaskCommentSection from '../../../../components/workspaceItems/TaskCommentSection';

interface TaskCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  itemId: number;
  task: WorkspaceTaskDetailResponse;
  /** コメント数が変更された時のコールバック */
  onCommentCountChange?: (count: number) => void;
  /** ワークスペース編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
}

export default function TaskCommentModal({
  isOpen,
  onClose,
  workspaceId,
  itemId,
  task,
  onCommentCountChange,
  canEdit = true,
}: TaskCommentModalProps) {
  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {task.taskTypeIcon && (
              <img
                src={`/icons/task/${task.taskTypeIcon.replace(/-/g, '').toLowerCase()}.svg`}
                alt={task.taskTypeName || ''}
                className="w-5 h-5 flex-shrink-0"
              />
            )}
            <span className="text-xs text-base-content/60 flex-shrink-0">T-{task.sequence}</span>
            <span className="font-medium text-sm truncate">{task.content}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-secondary flex-shrink-0"
            onClick={onClose}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* TaskCommentSection を使用 - h-full で親の高さを継承 */}
        <TaskCommentSection
          workspaceId={workspaceId}
          itemId={itemId}
          taskId={task.id}
          onCommentCountChange={onCommentCountChange}
          autoFocus
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
