'use client';

import type { WorkspaceTaskDetailResponse } from '@/connectors/api/pecus';
import TaskCommentSection from './TaskCommentSection';

interface TaskCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  itemId: number;
  task: WorkspaceTaskDetailResponse;
  currentUserId: number;
  /** コメント数が変更された時のコールバック */
  onCommentCountChange?: (count: number) => void;
}

export default function TaskCommentModal({
  isOpen,
  onClose,
  workspaceId,
  itemId,
  task,
  currentUserId,
  onCommentCountChange,
}: TaskCommentModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* モーダルヘッダー（閉じるボタン付き） */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 flex-shrink-0">
            <div className="flex items-center gap-2">
              {task.taskTypeIcon && (
                <img
                  src={`/icons/task/${task.taskTypeIcon.replace(/-/g, '').toLowerCase()}.svg`}
                  alt={task.taskTypeName || ''}
                  className="w-5 h-5"
                />
              )}
              <span className="font-medium text-sm truncate">{task.content}</span>
            </div>
            <button type="button" className="btn btn-sm btn-circle btn-secondary" onClick={onClose} aria-label="閉じる">
              <span className="icon-[mdi--close] size-5" aria-hidden="true" />
            </button>
          </div>

          {/* TaskCommentSection を使用 - h-full で親の高さを継承 */}
          <TaskCommentSection
            workspaceId={workspaceId}
            itemId={itemId}
            taskId={task.id}
            currentUserId={currentUserId}
            onCommentCountChange={onCommentCountChange}
            autoFocus
          />
        </div>
      </div>
    </>
  );
}
