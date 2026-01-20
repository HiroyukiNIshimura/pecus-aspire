'use client';

import { useState, useTransition } from 'react';
import { updateAttendance } from '@/actions/agenda';
import type { AttendanceStatus } from '@/connectors/api/pecus';

interface QuickAttendanceButtonsProps {
  agendaId: number;
  occurrenceIndex: number;
  currentStatus: AttendanceStatus | null | undefined;
  onUpdate: (agendaId: number, occurrenceIndex: number, newStatus: string) => void;
}

/** ステータスごとの設定 */
const statusConfig: Record<AttendanceStatus, { label: string; icon: string; activeClass: string }> = {
  Accepted: {
    label: '参加',
    icon: 'icon-[tabler--check]',
    activeClass: 'btn-success',
  },
  Tentative: {
    label: '仮',
    icon: 'icon-[tabler--help]',
    activeClass: 'btn-warning',
  },
  Declined: {
    label: '不参加',
    icon: 'icon-[tabler--x]',
    activeClass: 'btn-error',
  },
  Pending: {
    label: '未回答',
    icon: 'icon-[tabler--minus]',
    activeClass: 'btn-secondary',
  },
};

export default function QuickAttendanceButtons({
  agendaId,
  occurrenceIndex,
  currentStatus,
  onUpdate,
}: QuickAttendanceButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (newStatus: AttendanceStatus) => {
    if (newStatus === currentStatus) return;

    setError(null);
    startTransition(async () => {
      const result = await updateAttendance(agendaId, newStatus);
      if (result.success) {
        onUpdate(agendaId, occurrenceIndex, newStatus);
      } else {
        setError(result.message ?? '更新に失敗しました');
      }
    });
  };

  // 表示するボタン（Pending以外）
  const buttons: AttendanceStatus[] = ['Accepted', 'Tentative', 'Declined'];

  // 未回答かどうか
  const isUnanswered = !currentStatus || currentStatus === 'Pending';

  return (
    <div className="flex items-center gap-1">
      {/* 未回答ラベル（控えめ） */}
      {isUnanswered && (
        <span className="text-xs text-base-content/50 flex items-center gap-0.5 mr-1">
          <span className="icon-[tabler--clock] size-3" />
          未回答
        </span>
      )}

      {buttons.map((status) => {
        const config = statusConfig[status];
        const isActive = currentStatus === status;

        return (
          <button
            key={status}
            type="button"
            disabled={isPending}
            onClick={() => handleStatusChange(status)}
            className={`
              btn btn-xs
              ${isActive ? config.activeClass : 'btn-outline btn-secondary'}
              ${isPending ? 'loading' : ''}
            `}
            title={config.label}
          >
            {!isPending && <span className={`${config.icon} size-4`} />}
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}

      {/* エラー表示 */}
      {error && (
        <span className="text-xs text-error ml-1" title={error}>
          <span className="icon-[tabler--alert-circle] size-4" />
        </span>
      )}
    </div>
  );
}
