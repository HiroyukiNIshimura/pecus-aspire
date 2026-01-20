'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { fetchRecentOccurrencesPaginated } from '@/actions/agenda';
import AgendaTimeline from '@/components/agendas/AgendaTimeline';
import type { AgendaOccurrenceResponse } from '@/connectors/api/pecus';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface AgendaPageClientProps {
  initialOccurrences: AgendaOccurrenceResponse[];
  initialNextCursor: string | null;
  fetchError: string | null;
}

export default function AgendaPageClient({ initialOccurrences, initialNextCursor, fetchError }: AgendaPageClientProps) {
  const [occurrences, setOccurrences] = useState<AgendaOccurrenceResponse[]>(initialOccurrences);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [error, setError] = useState<string | null>(fetchError);

  // 追加読み込み
  const loadMore = useCallback(async () => {
    if (!nextCursor) return;

    const result = await fetchRecentOccurrencesPaginated(20, nextCursor);
    if (result.success) {
      setOccurrences((prev) => [...prev, ...result.data.items]);
      setNextCursor(result.data.nextCursor ?? null);
    } else {
      setError(result.message ?? '追加データの取得に失敗しました。');
    }
  }, [nextCursor]);

  const { sentinelRef, isLoading } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: !!nextCursor,
    rootMargin: '200px',
  });

  // 参加状況更新後にローカル状態を更新
  const handleAttendanceUpdate = (agendaId: number, occurrenceIndex: number, newStatus: string) => {
    setOccurrences((prev) =>
      prev.map((occ) =>
        occ.agendaId === agendaId && occ.occurrenceIndex === occurrenceIndex
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

      {/* 無限スクロール センチネル */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* ローディング表示 */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      )}

      {/* 終端表示 */}
      {!isLoading && !nextCursor && occurrences.length > 0 && (
        <p className="text-center text-base-content/50 text-sm py-4">すべての予定を表示しました</p>
      )}
    </div>
  );
}
