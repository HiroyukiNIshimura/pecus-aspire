'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
 * - JoinWorkspace の戻り値から initialStatus を受け取る（推奨）
 * - initialStatus がない場合は GetWorkspaceEditStatus で取得
 * - workspace:edit_started / workspace:edit_ended を購読してリアルタイム更新
 */
export default function WorkspaceEditStatus({
  workspaceId,
  currentUserId,
  initialStatus,
  onStatusChange,
  className,
}: WorkspaceEditStatusProps) {
  const { getWorkspaceEditStatus, onWorkspaceEditStarted, onWorkspaceEditEnded, connectionState } = useSignalRContext();
  const [status, setStatus] = useState<WorkspaceEditStatusType>({ isEditing: false });
  const lastWorkspaceIdRef = useRef(workspaceId);

  // workspaceId が変わった場合、または initialStatus が渡されたら状態を更新
  useEffect(() => {
    const workspaceChanged = workspaceId !== lastWorkspaceIdRef.current;
    lastWorkspaceIdRef.current = workspaceId;

    if (workspaceChanged) {
      // ワークスペースが変わった場合はリセット
      const newStatus = initialStatus ?? { isEditing: false };
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } else if (initialStatus) {
      // initialStatus が渡されたら状態を更新
      setStatus(initialStatus);
      onStatusChange?.(initialStatus);
    }
  }, [workspaceId, initialStatus, onStatusChange]);

  // initialStatus がない場合、接続が完了した時に取得
  useEffect(() => {
    // initialStatus が渡されている場合はスキップ
    if (initialStatus) return;

    // 接続していない場合はスキップ
    if (connectionState !== 'connected') return;

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
  }, [getWorkspaceEditStatus, workspaceId, onStatusChange, connectionState, initialStatus]);

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
        variant: 'warning' as const,
        text: 'ブラウザの別のタブで編集中です',
      };
    }
    return {
      variant: 'info' as const,
      text: `${editor.userName ?? '誰か'} さんが編集中です`,
    };
  }, [currentUserId, status]);

  if (!message) return null;

  return (
    <div className="animate-gentle-blink">
      <div className={`alert alert-soft alert-${message.variant} ${className ?? ''}`.trim()}>
        <div className="flex items-center gap-2">
          <span
            className={message.variant !== 'info' ? 'icon-[mdi--alert] w-4 h-4' : 'icon-[mdi--information] w-4 h-4'}
          />
          <span>{message.text}</span>
        </div>
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
