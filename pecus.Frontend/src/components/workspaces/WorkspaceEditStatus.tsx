'use client';

import { useEffect, useMemo, useState } from 'react';
import type { WorkspaceEditor, WorkspaceEditStatus as WorkspaceEditStatusType } from '@/providers/SignalRProvider';
import { useSignalRContext } from '@/providers/SignalRProvider';

interface WorkspaceEditStatusProps {
  workspaceId: number;
  currentUserId: number;
  initialStatus?: WorkspaceEditStatusType;
  onStatusChange?: (status: WorkspaceEditStatusType) => void;
  className?: string;
}

/**
 * ワークスペース編集状態を表示するコンポーネント。
 * - 初期状態取得 (GetWorkspaceEditStatus)
 * - workspace:edit_started / workspace:edit_ended を購読
 */
export default function WorkspaceEditStatus({
  workspaceId,
  currentUserId,
  initialStatus,
  onStatusChange,
  className,
}: WorkspaceEditStatusProps) {
  const { getWorkspaceEditStatus, onWorkspaceEditStarted, onWorkspaceEditEnded, connectionState } = useSignalRContext();
  const [status, setStatus] = useState<WorkspaceEditStatusType>(initialStatus ?? { isEditing: false });

  // 初期取得
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      const result = await getWorkspaceEditStatus(workspaceId);
      if (!active) return;
      setStatus(result);
      onStatusChange?.(result);
    };

    fetchStatus();

    return () => {
      active = false;
    };
  }, [getWorkspaceEditStatus, workspaceId, onStatusChange]);

  // イベント購読
  useEffect(() => {
    const unsubStart = onWorkspaceEditStarted((payload) => {
      if (payload.workspaceId !== workspaceId) return;
      const next: WorkspaceEditStatusType = {
        isEditing: true,
        editor: mapEditor(payload.userId, payload.userName, payload.identityIconUrl),
      };
      setStatus(next);
      onStatusChange?.(next);
    });

    const unsubEnd = onWorkspaceEditEnded((payload) => {
      if (payload.workspaceId !== workspaceId) return;
      const next: WorkspaceEditStatusType = { isEditing: false };
      setStatus(next);
      onStatusChange?.(next);
    });

    return () => {
      unsubStart();
      unsubEnd();
    };
  }, [workspaceId, onWorkspaceEditEnded, onWorkspaceEditStarted, onStatusChange]);

  // 接続断でローカル状態クリア
  useEffect(() => {
    if (connectionState === 'disconnected') {
      const cleared = { isEditing: false } as WorkspaceEditStatusType;
      setStatus(cleared);
      onStatusChange?.(cleared);
    }
  }, [connectionState, onStatusChange]);

  const message = useMemo(() => {
    if (!status.isEditing || !status.editor) return null;
    const { editor } = status;
    if (editor.userId === currentUserId) {
      return {
        variant: 'info' as const,
        text: '別のタブで編集中です',
      };
    }
    return {
      variant: 'warning' as const,
      text: `${editor.userName ?? '誰か'} さんが編集中です`,
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

function mapEditor(userId: number, userName: string, identityIconUrl: string | null): WorkspaceEditor {
  return {
    userId,
    userName,
    identityIconUrl,
  };
}
