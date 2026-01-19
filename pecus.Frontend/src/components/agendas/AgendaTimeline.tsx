'use client';

import { useMemo } from 'react';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import type { AgendaOccurrenceResponse } from '@/connectors/api/pecus';
import AgendaTimelineGroup from './AgendaTimelineGroup';

interface AgendaTimelineProps {
  occurrences: AgendaOccurrenceResponse[];
  onAttendanceUpdate: (agendaId: number, startAt: string, newStatus: string) => void;
}

/** 日付をグループ化するためのキーを取得（ローカルタイムゾーン） */
function getDateKey(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
}

/** 日付グループのラベルを取得（今日、明日、それ以外） */
function getGroupLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() === today.getTime()) {
    return '今日';
  }
  if (targetDate.getTime() === tomorrow.getTime()) {
    return '明日';
  }

  // 今週か来週かの判定
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfWeek.getDate() + 7);

  if (targetDate <= endOfWeek) {
    return '今週';
  }
  if (targetDate <= endOfNextWeek) {
    return '来週';
  }

  return '来週以降';
}

export default function AgendaTimeline({ occurrences, onAttendanceUpdate }: AgendaTimelineProps) {
  // オカレンスを日付でグループ化
  const groupedOccurrences = useMemo(() => {
    const groups = new Map<string, AgendaOccurrenceResponse[]>();

    // 開始日時でソート
    const sorted = [...occurrences].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    for (const occ of sorted) {
      const key = getDateKey(occ.startAt);
      const existing = groups.get(key) ?? [];
      existing.push(occ);
      groups.set(key, existing);
    }

    return groups;
  }, [occurrences]);

  // グループラベルでさらに分類（今日、明日、今週、来週、来週以降）
  const labeledGroups = useMemo(() => {
    const result = new Map<string, Map<string, AgendaOccurrenceResponse[]>>();

    for (const [dateKey, items] of groupedOccurrences) {
      if (items.length === 0) continue;
      const label = getGroupLabel(items[0].startAt);

      if (!result.has(label)) {
        result.set(label, new Map());
      }
      result.get(label)!.set(dateKey, items);
    }

    return result;
  }, [groupedOccurrences]);

  if (occurrences.length === 0) {
    return (
      <EmptyState
        iconClass="icon-[tabler--calendar-off]"
        message="予定がありません"
        description="まだ予定が登録されていません。新規作成から予定を追加してください。"
      />
    );
  }

  // 表示順序を固定
  const labelOrder = ['今日', '明日', '今週', '来週', '来週以降'];

  return (
    <div className="space-y-8">
      {labelOrder.map((label) => {
        const dateGroups = labeledGroups.get(label);
        if (!dateGroups || dateGroups.size === 0) return null;

        return (
          <div key={label}>
            {/* セクションラベル */}
            <h2 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
              <span className="icon-[tabler--calendar] size-5 text-primary" />
              {label}
            </h2>

            {/* 各日付グループ */}
            <div className="space-y-4">
              {Array.from(dateGroups.entries()).map(([dateKey, items]) => (
                <AgendaTimelineGroup
                  key={dateKey}
                  dateLabel={dateKey}
                  occurrences={items}
                  onAttendanceUpdate={onAttendanceUpdate}
                  showDateLabel={label !== '今日' && label !== '明日'}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
