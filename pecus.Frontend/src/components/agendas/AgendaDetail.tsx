'use client';

import { useState } from 'react';
import Markdown from 'react-markdown';
import type { AgendaExceptionResponse, AgendaResponse, AttendanceStatus, RecurrenceType } from '@/connectors/api/pecus';
import { remarkItemCodeLinks } from '@/libs/markdown/remarkItemCodeLinks';

interface AgendaDetailProps {
  agenda: AgendaResponse;
  exceptions: AgendaExceptionResponse[];
  currentStatus?: AttendanceStatus;
  isPending: boolean;
  onAttendanceChange: (status: AttendanceStatus) => void;
  /** 特定回表示中の場合のラベル（例: "1/21"） */
  occurrenceLabel?: string;
  /** この回以降の参加状況を一括変更（繰り返しイベント用） */
  onBulkAttendanceChange?: (status: AttendanceStatus) => void;
}

const recurrenceLabels: Record<string, string> = {
  Daily: '毎日',
  Weekly: '毎週',
  Biweekly: '隔週',
  Monthly: '毎月',
  MonthlyByWeekday: '毎月（曜日指定）',
  Yearly: '毎年',
};

const attendanceOptions: { status: AttendanceStatus; label: string; icon: string; activeClass: string }[] = [
  { status: 'Accepted', label: '参加', icon: 'icon-[tabler--check]', activeClass: 'btn-success' },
  { status: 'Tentative', label: '仮', icon: 'icon-[tabler--help]', activeClass: 'btn-warning' },
  { status: 'Declined', label: '不参加', icon: 'icon-[tabler--x]', activeClass: 'btn-error' },
];

export function AgendaDetail({
  agenda,
  exceptions,
  currentStatus,
  isPending,
  onAttendanceChange,
  occurrenceLabel,
  onBulkAttendanceChange,
}: AgendaDetailProps) {
  const isCancelled = agenda.isCancelled;
  const recurrenceType = agenda.recurrenceType as RecurrenceType | undefined;
  const isRecurring = recurrenceType && recurrenceType !== 'None';
  // 「この回以降」セクションの展開状態
  const [isBulkExpanded, setIsBulkExpanded] = useState(false);

  const formatDateTime = (dateStr: string, isAllDay: boolean) => {
    const date = new Date(dateStr);
    if (isAllDay) {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
    }
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateRange = () => {
    const startFormatted = formatDateTime(agenda.startAt, agenda.isAllDay);
    const endFormatted = formatDateTime(agenda.endAt, agenda.isAllDay);

    if (agenda.isAllDay) {
      const startDate = new Date(agenda.startAt).toDateString();
      const endDate = new Date(agenda.endAt).toDateString();
      if (startDate === endDate) {
        return `${startFormatted}（終日）`;
      }
      return `${startFormatted} 〜 ${endFormatted}（終日）`;
    }

    const startDate = new Date(agenda.startAt).toDateString();
    const endDate = new Date(agenda.endAt).toDateString();
    if (startDate === endDate) {
      const endTime = new Date(agenda.endAt).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${startFormatted} 〜 ${endTime}`;
    }
    return `${startFormatted} 〜 ${endFormatted}`;
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        {/* タイトル & バッジ */}
        <div className="flex items-start gap-3">
          {isCancelled && <span className="badge badge-error shrink-0">中止</span>}
          {isRecurring && (
            <span className="badge badge-info shrink-0">{recurrenceLabels[recurrenceType] ?? '繰り返し'}</span>
          )}
          <h1 className={`card-title text-xl ${isCancelled ? 'text-base-content/50 line-through' : ''}`}>
            {agenda.title}
          </h1>
        </div>

        {/* 中止理由 */}
        {isCancelled && agenda.cancellationReason && (
          <div className="alert alert-warning mt-2">
            <span className="icon-[tabler--info-circle] size-5" />
            <div>
              <p className="font-medium">中止理由</p>
              <p className="text-sm">{agenda.cancellationReason}</p>
            </div>
          </div>
        )}

        {/* 日時 */}
        <div className="mt-4 flex items-start gap-3">
          <span className="icon-[tabler--calendar] size-5 text-base-content/70 mt-0.5" />
          <div>
            <p className="font-medium">{formatDateRange()}</p>
            {isRecurring && agenda.recurrenceEndDate && (
              <p className="text-sm text-base-content/60">
                繰り返し終了: {new Date(agenda.recurrenceEndDate).toLocaleDateString('ja-JP')}
              </p>
            )}
            {isRecurring && agenda.recurrenceCount && (
              <p className="text-sm text-base-content/60">{agenda.recurrenceCount}回まで繰り返し</p>
            )}
          </div>
        </div>

        {/* 場所 */}
        {agenda.location && (
          <div className="mt-3 flex items-start gap-3">
            <span className="icon-[tabler--map-pin] size-5 text-base-content/70 mt-0.5" />
            <p>{agenda.location}</p>
          </div>
        )}

        {/* URL */}
        {agenda.url && (
          <div className="mt-3 flex items-start gap-3">
            <span className="icon-[tabler--link] size-5 text-base-content/70 mt-0.5" />
            <a href={agenda.url} target="_blank" rel="noopener noreferrer" className="link link-primary break-all">
              {agenda.url}
            </a>
          </div>
        )}

        {/* 詳細 */}
        {agenda.description && (
          <div className="mt-4">
            <h3 className="mb-2 font-medium text-base-content/70">詳細</h3>
            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
              <Markdown remarkPlugins={[remarkItemCodeLinks]}>{agenda.description}</Markdown>
            </div>
          </div>
        )}

        {/* リマインダー設定 */}
        {agenda.reminders && agenda.reminders.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 font-medium text-base-content/70">リマインダー</h3>
            <div className="flex flex-wrap gap-2">
              {agenda.reminders.map((minutes) => (
                <span key={minutes} className="badge badge-neutral">
                  {minutes >= 60 ? `${Math.floor(minutes / 60)}時間前` : `${minutes}分前`}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="divider" />

        {/* 参加状況変更（参加者のみ表示） */}
        {!isCancelled && currentStatus !== undefined && (
          <div>
            <h3 className="mb-3 font-medium">{occurrenceLabel ? `${occurrenceLabel} の参加状況` : '参加状況を変更'}</h3>
            <div className="flex flex-wrap gap-2">
              {attendanceOptions.map(({ status, label, icon, activeClass }) => (
                <button
                  key={status}
                  type="button"
                  className={`btn btn-sm ${currentStatus === status ? activeClass : 'btn-secondary'}`}
                  disabled={isPending}
                  onClick={() => onAttendanceChange(status)}
                >
                  <span className={`${icon} size-4`} />
                  {label}
                </button>
              ))}
            </div>

            {/* この回以降の一括設定（繰り返しイベント＆特定回表示中の場合のみ表示） */}
            {isRecurring && occurrenceLabel && onBulkAttendanceChange && (
              <div className="mt-4 border-t border-base-300 pt-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setIsBulkExpanded(!isBulkExpanded)}
                  disabled={isPending}
                >
                  <span className="text-sm font-medium text-base-content/80">この回以降の一括設定</span>
                  <svg
                    className={`size-5 text-base-content/60 transition-transform ${isBulkExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isBulkExpanded && (
                  <div className="mt-3 space-y-2">
                    <p className="mb-2 text-xs text-base-content/60">
                      {occurrenceLabel} 以降のすべての回の参加状況を一括で変更します。
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {attendanceOptions.map(({ status, label, icon }) => (
                        <button
                          key={status}
                          type="button"
                          className="btn btn-sm btn-secondary"
                          disabled={isPending}
                          onClick={() => onBulkAttendanceChange(status)}
                        >
                          {isPending ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <>
                              <span className={`${icon} size-4`} />
                              以降すべて{label}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 例外一覧（繰り返しアジェンダのみ） */}
        {isRecurring && exceptions.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-medium text-base-content/70">変更・中止された回</h3>
            <div className="space-y-2">
              {exceptions.map((ex) => (
                <div key={ex.id} className="rounded-lg border border-base-300 bg-base-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {ex.originalStartAt
                        ? new Date(ex.originalStartAt).toLocaleDateString('ja-JP', {
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })
                        : `第${ex.occurrenceIndex + 1}回`}
                    </span>
                    {ex.isCancelled && <span className="badge badge-error badge-sm">中止</span>}
                    {ex.modifiedStartAt && <span className="badge badge-warning badge-sm">日時変更</span>}
                  </div>
                  {ex.cancellationReason && (
                    <p className="mt-1 text-sm text-base-content/60">{ex.cancellationReason}</p>
                  )}
                  {ex.modifiedStartAt && (
                    <p className="mt-1 text-sm text-base-content/60">
                      → {new Date(ex.modifiedStartAt).toLocaleString('ja-JP')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 作成者・更新日時 */}
        <div className="mt-6 text-sm text-base-content/50">
          <p>
            作成者: {agenda.createdBy?.username ?? '不明'} ・ 作成日:{' '}
            {new Date(agenda.createdAt).toLocaleDateString('ja-JP')}
          </p>
          <p>最終更新: {new Date(agenda.updatedAt).toLocaleDateString('ja-JP')}</p>
        </div>
      </div>
    </div>
  );
}
