'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateAttendance } from '@/actions/agenda';
import { AgendaDetail } from '@/components/agendas/AgendaDetail';
import { AttendeeList } from '@/components/agendas/AttendeeList';
import { CancelConfirmModal } from '@/components/agendas/CancelConfirmModal';
import { type EditScope, EditScopeModal } from '@/components/agendas/EditScopeModal';
import type { AgendaExceptionResponse, AgendaResponse, AttendanceStatus, RecurrenceType } from '@/connectors/api/pecus';
import { useAppSettings } from '@/providers/AppSettingsProvider';

interface AgendaDetailClientProps {
  agenda: AgendaResponse;
  exceptions: AgendaExceptionResponse[];
  fetchError: string | null;
  /** 特定回のインデックス（タイムラインからのリンク経由） */
  occurrenceIndex?: number;
}

export default function AgendaDetailClient({
  agenda,
  exceptions,
  fetchError,
  occurrenceIndex,
}: AgendaDetailClientProps) {
  const { currentUser } = useAppSettings();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(fetchError);
  const [currentAgenda, setCurrentAgenda] = useState(agenda);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditScopeModalOpen, setIsEditScopeModalOpen] = useState(false);

  // 現在のユーザーの参加状況を取得
  const currentUserAttendee = currentAgenda.attendees?.find((a) => a.userId === currentUser?.id);
  const currentStatus = currentUserAttendee?.status;

  // 繰り返しアジェンダかどうか
  const recurrenceType = currentAgenda.recurrenceType as RecurrenceType | undefined;
  const isRecurring = recurrenceType && recurrenceType !== 'None';

  // 表示対象の回のインデックス
  // - URLパラメータで指定されていればそれを使用
  // - 指定されていない場合は0（最初の回）
  const effectiveOccurrenceIndex = occurrenceIndex ?? 0;

  // 表示対象の回の開始日時（日付表示用）
  // - バックエンドから返されたstartAtを使用（例外適用済み）
  const effectiveOccurrenceStartAt = currentAgenda.startAt;

  // 特定回の日付表示用（例: "1/26"）
  const occurrenceDate = new Date(effectiveOccurrenceStartAt).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  });

  // シリーズの最初の回かどうか（最初の回からは「この回以降」の分割はできない）
  const isFirstOccurrence = effectiveOccurrenceIndex === 0;

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

  // 編集ボタンクリック
  const handleEditClick = () => {
    if (isRecurring) {
      // 繰り返しアジェンダの場合、編集範囲選択モーダルを表示
      setIsEditScopeModalOpen(true);
    } else {
      // 単発アジェンダの場合は直接編集ページへ
      router.push(`/agendas/${currentAgenda.id}/edit`);
    }
  };

  // 編集範囲選択完了
  const handleEditScopeSelect = (scope: EditScope) => {
    setIsEditScopeModalOpen(false);

    switch (scope) {
      case 'all':
        // シリーズ全体の編集
        router.push(`/agendas/${currentAgenda.id}/edit`);
        break;
      case 'this-and-future':
        // この回以降の編集（シリーズ分割）
        // 編集ページにscope=fromパラメータを追加
        router.push(`/agendas/${currentAgenda.id}/edit?scope=from&occurrence=${effectiveOccurrenceIndex}`);
        break;
      case 'this-only':
        // この回のみの編集（例外作成）
        // 特定回の編集ページへ遷移（現時点では未実装のためアラート表示）
        // TODO: 特定回の編集ページが実装されたら遷移先を変更
        router.push(`/agendas/${currentAgenda.id}/edit?scope=single&occurrence=${effectiveOccurrenceIndex}`);
        break;
    }
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
            <button type="button" className="btn btn-primary btn-sm" onClick={handleEditClick}>
              <span className="icon-[tabler--pencil] size-4" />
              編集
            </button>
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

      {/* 編集範囲選択モーダル */}
      {isRecurring && (
        <EditScopeModal
          isOpen={isEditScopeModalOpen}
          onClose={() => setIsEditScopeModalOpen(false)}
          onSelect={handleEditScopeSelect}
          agendaTitle={currentAgenda.title}
          occurrenceDate={occurrenceDate || undefined}
          isFirstOccurrence={isFirstOccurrence}
          isPending={isPending}
        />
      )}
    </div>
  );
}
