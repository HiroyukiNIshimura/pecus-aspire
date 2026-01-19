'use client';

import Link from 'next/link';
import { useState } from 'react';
import AgendaTimeline from '@/components/agendas/AgendaTimeline';
import type { AgendaOccurrenceResponse } from '@/connectors/api/pecus';

interface AgendaPageClientProps {
  initialOccurrences: AgendaOccurrenceResponse[];
  fetchError: string | null;
}

export default function AgendaPageClient({ initialOccurrences, fetchError }: AgendaPageClientProps) {
  const [occurrences, setOccurrences] = useState<AgendaOccurrenceResponse[]>(initialOccurrences);
  const [error, setError] = useState<string | null>(fetchError);

  // 参加状況更新後にローカル状態を更新
  const handleAttendanceUpdate = (agendaId: number, startAt: string, newStatus: string) => {
    setOccurrences((prev) =>
      prev.map((occ) =>
        occ.agendaId === agendaId && occ.startAt === startAt
          ? { ...occ, myAttendanceStatus: newStatus as AgendaOccurrenceResponse['myAttendanceStatus'] }
          : occ,
      ),
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">📅 今後の予定</h1>
          <p className="text-sm text-base-content/60 mt-1">予定されているアジェンダを確認・管理できます</p>
        </div>
        <Link href="/agendas/new" className="btn btn-primary">
          <span className="icon-[tabler--plus] size-5" />
          新規作成
        </Link>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="alert alert-error mb-4">
          <span className="icon-[tabler--alert-circle] size-5" />
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setError(null)}>
            閉じる
          </button>
        </div>
      )}

      {/* タイムライン */}
      <AgendaTimeline occurrences={occurrences} onAttendanceUpdate={handleAttendanceUpdate} />
    </div>
  );
}
