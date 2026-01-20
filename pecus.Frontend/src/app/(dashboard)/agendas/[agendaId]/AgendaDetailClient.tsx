'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateAttendance } from '@/actions/agenda';
import { AgendaDetail } from '@/components/agendas/AgendaDetail';
import { AttendeeList } from '@/components/agendas/AttendeeList';
import { CancelConfirmModal } from '@/components/agendas/CancelConfirmModal';
import type { AgendaExceptionResponse, AgendaResponse, AttendanceStatus, RecurrenceType } from '@/connectors/api/pecus';
import { useAppSettings } from '@/providers/AppSettingsProvider';

interface AgendaDetailClientProps {
  agenda: AgendaResponse;
  exceptions: AgendaExceptionResponse[];
  fetchError: string | null;
}

export default function AgendaDetailClient({ agenda, exceptions, fetchError }: AgendaDetailClientProps) {
  const { currentUser } = useAppSettings();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(fetchError);
  const [currentAgenda, setCurrentAgenda] = useState(agenda);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // 現在のユーザーの参加状況を取得
  const currentUserAttendee = currentAgenda.attendees?.find((a) => a.userId === currentUser?.id);
  const currentStatus = currentUserAttendee?.status;

  // 繰り返しアジェンダかどうか
  const recurrenceType = currentAgenda.recurrenceType as RecurrenceType | undefined;
  const isRecurring = recurrenceType && recurrenceType !== 'None';

  const handleAttendanceChange = (newStatus: AttendanceStatus) => {
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await updateAttendance(currentAgenda.id, newStatus);
      if (result.success) {
        // 参加状況をローカルで更新
        setCurrentAgenda((prev) => ({
          ...prev,
          attendees: prev.attendees?.map((a) => (a.userId === currentUser?.id ? { ...a, status: newStatus } : a)),
        }));
      } else {
        setError(result.message ?? '参加状況の更新に失敗しました。');
      }
    });
  };

  const handleCancelled = () => {
    setIsCancelModalOpen(false);
    // 中止完了後、一覧ページにリダイレクト
    router.push('/agendas');
    router.refresh();
  };

  if (error) {
    return (
      <div className="flex flex-1 flex-col p-4">
        <div className="alert alert-error">
          <span className="icon-[tabler--alert-circle] size-5" />
          <span>{error}</span>
        </div>
        <div className="mt-4">
          <Link href="/agendas" className="btn btn-secondary">
            <span className="icon-[tabler--arrow-left] size-5" />
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/agendas" className="btn btn-secondary btn-sm">
          <span className="icon-[tabler--arrow-left] size-4" />
          戻る
        </Link>

        {/* アクションボタン（中止されていない場合のみ） */}
        {!currentAgenda.isCancelled && (
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-error btn-sm" onClick={() => setIsCancelModalOpen(true)}>
              <span className="icon-[mdi--cancel] size-4" />
              {isRecurring ? 'シリーズを中止' : '中止'}
            </button>
            <Link href={`/agendas/${currentAgenda.id}/edit`} className="btn btn-primary btn-sm">
              <span className="icon-[tabler--pencil] size-4" />
              編集
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* メイン詳細（左側2/3） */}
        <div className="md:col-span-2">
          <AgendaDetail
            agenda={currentAgenda}
            exceptions={exceptions}
            currentStatus={currentStatus}
            isPending={isPending}
            onAttendanceChange={handleAttendanceChange}
          />
        </div>

        {/* 参加者リスト（右側1/3） */}
        <div className="md:col-span-1">
          <AttendeeList attendees={currentAgenda.attendees ?? []} currentUserId={currentUser?.id} />
        </div>
      </div>

      {/* 中止確認モーダル */}
      <CancelConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onCancelled={handleCancelled}
        agendaId={currentAgenda.id}
        agendaTitle={currentAgenda.title}
        rowVersion={currentAgenda.rowVersion}
        isRecurring={!!isRecurring}
      />
    </div>
  );
}
