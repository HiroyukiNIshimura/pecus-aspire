'use client';

import type { AttendanceStatus } from '@/connectors/api/pecus';

interface OccurrenceAttendanceSelectorProps {
  /** シリーズ全体の参加状況（デフォルト） */
  seriesStatus?: AttendanceStatus;
  /** この回のみの参加状況（null = シリーズと同じ） */
  occurrenceStatus?: AttendanceStatus | null;
  /** 処理中フラグ */
  isPending: boolean;
  /** この回の日付表示（例: "1/26"） */
  occurrenceDate: string;
  /** この回のみの参加状況を変更 */
  onOccurrenceStatusChange: (status: AttendanceStatus) => void;
  /** シリーズと同じに戻す */
  onResetToSeries: () => void;
}

const statusLabels: Record<AttendanceStatus, string> = {
  Pending: '未回答',
  Accepted: '参加',
  Tentative: '仮参加',
  Declined: '不参加',
};

const statusOptions: { status: AttendanceStatus; label: string }[] = [
  { status: 'Accepted', label: '参加' },
  { status: 'Tentative', label: '仮参加' },
  { status: 'Declined', label: '不参加' },
];

export function OccurrenceAttendanceSelector({
  seriesStatus,
  occurrenceStatus,
  isPending,
  occurrenceDate,
  onOccurrenceStatusChange,
  onResetToSeries,
}: OccurrenceAttendanceSelectorProps) {
  // シリーズと同じかどうか（この回の個別回答がない）
  const isSameAsSeries = occurrenceStatus === null || occurrenceStatus === undefined;

  return (
    <div className="mt-4 rounded-lg border border-base-300 bg-base-200/50 p-4">
      <h3 className="mb-3 font-medium">{occurrenceDate} の参加状況</h3>

      <div className="space-y-2">
        {/* シリーズと同じ */}
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
            isSameAsSeries ? 'border-primary bg-primary/10' : 'border-base-300 hover:bg-base-200'
          } ${isPending ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input
            type="radio"
            name="occurrence-attendance"
            className="radio radio-primary radio-sm"
            checked={isSameAsSeries}
            disabled={isPending}
            onChange={() => onResetToSeries()}
          />
          <div className="flex-1">
            <span className="font-medium">シリーズと同じ</span>
            {seriesStatus && (
              <span className="ml-2 text-sm text-base-content/60">（現在: {statusLabels[seriesStatus]}）</span>
            )}
          </div>
        </label>

        {/* 各ステータスの選択肢 */}
        {statusOptions.map(({ status, label }) => {
          const isSelected = !isSameAsSeries && occurrenceStatus === status;
          return (
            <label
              key={status}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                isSelected ? 'border-primary bg-primary/10' : 'border-base-300 hover:bg-base-200'
              } ${isPending ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="occurrence-attendance"
                className="radio radio-primary radio-sm"
                checked={isSelected}
                disabled={isPending}
                onChange={() => onOccurrenceStatusChange(status)}
              />
              <span className="font-medium">この回のみ{label}</span>
            </label>
          );
        })}
      </div>

      {/* 現在の状態表示 */}
      <div className="mt-3 text-sm text-base-content/60">
        {isSameAsSeries ? (
          <p>シリーズ全体の参加状況が適用されます。</p>
        ) : (
          <p>この回のみ個別の参加状況が設定されています。</p>
        )}
      </div>
    </div>
  );
}
