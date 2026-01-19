'use client';

import Link from 'next/link';
import type { AgendaOccurrenceResponse, RecurrenceType } from '@/connectors/api/pecus';
import QuickAttendanceButtons from './QuickAttendanceButtons';

interface AgendaTimelineItemProps {
  occurrence: AgendaOccurrenceResponse;
  onAttendanceUpdate: (agendaId: number, startAt: string, newStatus: string) => void;
}

/** 時刻をフォーマット */
function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 繰り返しタイプのラベル */
function getRecurrenceLabel(type: RecurrenceType | null | undefined): string | null {
  if (!type || type === 'None') return null;

  const labels: Record<string, string> = {
    Daily: '毎日',
    Weekly: '毎週',
    Biweekly: '隔週',
    MonthlyByDate: '毎月',
    MonthlyByWeekday: '毎月',
    Yearly: '毎年',
  };

  return labels[type] ?? null;
}

export default function AgendaTimelineItem({ occurrence, onAttendanceUpdate }: AgendaTimelineItemProps) {
  const {
    agendaId,
    startAt,
    endAt,
    title,
    location,
    url,
    isAllDay,
    recurrenceType,
    isCancelled,
    cancellationReason,
    isModified,
    attendeeCount,
  } = occurrence;

  const recurrenceLabel = getRecurrenceLabel(recurrenceType);
  const isCancelledItem = isCancelled ?? false;

  return (
    <div
      className={`
        relative -ml-4 pl-6 py-3 pr-4
        rounded-r-lg transition-colors
        ${isCancelledItem ? 'bg-base-200/50 opacity-60' : 'bg-base-100 hover:bg-base-200/30'}
      `}
    >
      {/* タイムラインのドット */}
      <div
        className={`
          absolute left-0 top-4 -translate-x-1/2
          size-3 rounded-full border-2 border-base-100
          ${isCancelledItem ? 'bg-base-content/30' : 'bg-primary'}
        `}
      />

      {/* メインコンテンツ */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        {/* 左側：タイトル・時刻・詳細 */}
        <div className="flex-1 min-w-0">
          {/* タイトル行 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 時刻 */}
            {!isAllDay && <span className="text-sm font-medium text-primary tabular-nums">{formatTime(startAt)}</span>}
            {isAllDay && <span className="badge badge-sm badge-secondary">終日</span>}

            {/* タイトル */}
            <Link
              href={`/agendas/${agendaId}?startAt=${encodeURIComponent(startAt)}`}
              className={`
                font-medium truncate max-w-xs sm:max-w-md
                ${isCancelledItem ? 'line-through text-base-content/50' : 'text-base-content hover:text-primary'}
              `}
            >
              {title}
            </Link>

            {/* 繰り返しバッジ */}
            {recurrenceLabel && (
              <span className="badge badge-sm badge-outline">
                <span className="icon-[tabler--repeat] size-3 mr-1" />
                {recurrenceLabel}
              </span>
            )}

            {/* 変更済みバッジ */}
            {isModified && !isCancelledItem && <span className="badge badge-sm badge-warning">変更あり</span>}
          </div>

          {/* 詳細行 */}
          <div className="flex items-center gap-3 mt-1 text-sm text-base-content/60 flex-wrap">
            {/* 終了時刻 */}
            {!isAllDay && (
              <span className="flex items-center gap-1">
                <span className="icon-[tabler--clock] size-4" />
                {formatTime(startAt)} - {formatTime(endAt)}
              </span>
            )}

            {/* 場所 */}
            {location && (
              <span className="flex items-center gap-1 truncate max-w-32">
                <span className="icon-[tabler--map-pin] size-4" />
                {location}
              </span>
            )}

            {/* URL */}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-info hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="icon-[tabler--link] size-4" />
                オンライン
              </a>
            )}

            {/* 参加者数 */}
            {(attendeeCount ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <span className="icon-[tabler--users] size-4" />
                {attendeeCount}人
              </span>
            )}
          </div>

          {/* 中止理由 */}
          {isCancelledItem && cancellationReason && (
            <div className="mt-2 p-2 bg-error/10 rounded text-sm text-error flex items-start gap-2">
              <span className="icon-[tabler--ban] size-4 mt-0.5 shrink-0" />
              <span>中止: {cancellationReason}</span>
            </div>
          )}
        </div>

        {/* 右側：クイックアクション */}
        {!isCancelledItem && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <QuickAttendanceButtons
              agendaId={agendaId}
              startAt={startAt}
              currentStatus={occurrence.myAttendanceStatus}
              onUpdate={onAttendanceUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
