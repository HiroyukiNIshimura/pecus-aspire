'use client';

import type { AgendaOccurrenceResponse } from '@/connectors/api/pecus';
import AgendaTimelineItem from './AgendaTimelineItem';

interface AgendaTimelineGroupProps {
  dateLabel: string;
  occurrences: AgendaOccurrenceResponse[];
  onAttendanceUpdate: (agendaId: number, startAt: string, newStatus: string) => void;
  /** 今日・明日以外の場合に日付ラベルを表示 */
  showDateLabel?: boolean;
}

export default function AgendaTimelineGroup({
  dateLabel,
  occurrences,
  onAttendanceUpdate,
  showDateLabel = true,
}: AgendaTimelineGroupProps) {
  return (
    <div className="relative">
      {/* 日付ラベル（今日・明日以外） */}
      {showDateLabel && (
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-base-300" />
          <span className="text-sm text-base-content/60 font-medium px-2">{dateLabel}</span>
          <div className="h-px flex-1 bg-base-300" />
        </div>
      )}

      {/* タイムラインアイテム */}
      <div className="space-y-3 pl-4 border-l-2 border-base-300">
        {occurrences.map((occ) => (
          <AgendaTimelineItem
            key={`${occ.agendaId}-${occ.startAt}`}
            occurrence={occ}
            onAttendanceUpdate={onAttendanceUpdate}
          />
        ))}
      </div>
    </div>
  );
}
