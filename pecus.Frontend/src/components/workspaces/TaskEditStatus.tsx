'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { TaskEditor, TaskEditStatus as TaskEditStatusType } from '@/providers/SignalRProvider';
import { useSignalRContext } from '@/providers/SignalRProvider';

interface TaskEditStatusProps {
  taskId: number;
  currentUserId: number;
  /** 親コンポーネントから渡される編集状態（必須） */
  status: TaskEditStatusType;
  onStatusChange?: (status: TaskEditStatusType) => void;
  className?: string;
}

/**
 * タスク編集状態を表示するコンポーネント。
 * - 初期状態は親コンポーネントから props で受け取る
 * - task:edit_started / task:edit_ended を購読してリアルタイム更新
 */
export default function TaskEditStatus({
  taskId,
  currentUserId,
  status,
  onStatusChange,
  className,
}: TaskEditStatusProps) {
  const { onTaskEditStarted, onTaskEditEnded } = useSignalRContext();

  // onStatusChangeをrefで保持して依存配列から外す
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // イベント購読（リアルタイム更新用）
  useEffect(() => {
    const unsubStart = onTaskEditStarted((payload) => {
      if (payload.taskId !== taskId) return;
      const next: TaskEditStatusType = {
        isEditing: true,
        editor: mapEditor(payload.userId, payload.userName, payload.identityIconUrl),
      };
      onStatusChangeRef.current?.(next);
    });

    const unsubEnd = onTaskEditEnded((payload) => {
      if (payload.taskId !== taskId) return;
      const next: TaskEditStatusType = { isEditing: false };
      onStatusChangeRef.current?.(next);
    });

    return () => {
      unsubStart();
      unsubEnd();
    };
  }, [onTaskEditEnded, onTaskEditStarted, taskId]);

  const message = useMemo(() => {
    if (!status.isEditing) return null;
    const editor = status.editor;
    if (editor && editor.userId === currentUserId) {
      return {
        variant: 'info' as const,
        text: '別のタブで編集中です',
      };
    }
    return {
      variant: 'warning' as const,
      text: `${editor?.userName ?? '誰か'} さんが編集中です`,
    };
  }, [currentUserId, status]);

  if (!message) return null;

  return (
    <div className={`alert alert-soft alert-${message.variant} ${className ?? ''}`.trim()}>
      <div className="flex items-center gap-2">
        <span
          className={message.variant === 'warning' ? 'icon-[mdi--alert] w-4 h-4' : 'icon-[mdi--information] w-4 h-4'}
        />
        <span>{message.text}</span>
      </div>
    </div>
  );
}

function mapEditor(userId: number, userName: string, identityIconUrl: string | null): TaskEditor {
  return {
    userId,
    userName,
    identityIconUrl,
  };
}
