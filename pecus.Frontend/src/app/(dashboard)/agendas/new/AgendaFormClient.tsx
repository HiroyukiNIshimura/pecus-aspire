'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createAgenda, updateAgenda, updateAgendaFromOccurrence, updateOccurrence } from '@/actions/agenda';
import { AgendaForm, type AgendaFormData } from '@/components/agendas/AgendaForm';
import type {
  AgendaResponse,
  CreateAgendaRequest,
  RecurrenceType,
  UpdateAgendaRequest,
  UpdateFromOccurrenceRequest,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';

/** 編集範囲 */
export type EditScope = 'from' | 'single';

interface AgendaFormClientProps {
  mode: 'create' | 'edit';
  initialData?: AgendaResponse;
  /** 現在のユーザーID（必須: 参加者選択で主催者を除外するため） */
  currentUserId: number;
  /** 編集範囲（繰り返しアジェンダの場合） */
  editScope?: EditScope;
  /** 対象回のインデックス（繰り返しアジェンダで特定回を編集する場合） */
  occurrenceIndex?: number;
}

export default function AgendaFormClient({
  mode,
  initialData,
  currentUserId,
  editScope,
  occurrenceIndex,
}: AgendaFormClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: AgendaFormData) => {
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      if (mode === 'create') {
        const request: CreateAgendaRequest = {
          title: formData.title,
          description: formData.description || null,
          startAt: formData.startAt,
          endAt: formData.endAt,
          isAllDay: formData.isAllDay,
          location: formData.location || null,
          url: formData.url || null,
          recurrenceType: formData.recurrenceType as RecurrenceType,
          recurrenceInterval: formData.recurrenceInterval,
          recurrenceEndDate: formData.recurrenceEndDate || null,
          recurrenceCount: formData.recurrenceCount || null,
          reminders: formData.reminders,
          attendees: formData.attendees,
          sendNotification: formData.sendNotification,
        };

        const result = await createAgenda(request);
        if (result.success) {
          notify.success('予定を作成しました');
          router.push(`/agendas/${result.data.id}`);
        } else {
          setError(result.message ?? 'アジェンダの作成に失敗しました。');
        }
      } else if (initialData) {
        // 編集モード
        if (editScope === 'from' && occurrenceIndex !== undefined) {
          // 「この回以降」更新（シリーズ分割）
          const request: UpdateFromOccurrenceRequest = {
            fromOccurrenceIndex: occurrenceIndex,
            title: formData.title,
            description: formData.description || null,
            startAt: formData.startAt,
            endAt: formData.endAt,
            isAllDay: formData.isAllDay,
            location: formData.location || null,
            url: formData.url || null,
            recurrenceType: formData.recurrenceType as RecurrenceType,
            recurrenceInterval: formData.recurrenceInterval,
            recurrenceEndDate: formData.recurrenceEndDate || null,
            recurrenceCount: formData.recurrenceCount || null,
            reminders: formData.reminders,
            attendees: formData.attendees,
            sendNotification: formData.sendNotification,
          };

          const result = await updateAgendaFromOccurrence(initialData.id, request);
          if (result.success) {
            notify.success('予定を更新しました');
            // 新しく作成されたシリーズの詳細ページへ遷移
            router.push(`/agendas/${result.data.id}`);
          } else {
            setError(result.message ?? 'アジェンダの更新に失敗しました。');
          }
        } else if (editScope === 'single' && occurrenceIndex !== undefined) {
          // 「この回のみ」更新（例外作成）
          const result = await updateOccurrence(initialData.id, occurrenceIndex, {
            title: formData.title,
            location: formData.location || undefined,
            url: formData.url || undefined,
            description: formData.description || undefined,
            startAt: formData.startAt,
            endAt: formData.endAt,
          });
          if (result.success) {
            notify.success('この回を更新しました');
            // 元のアジェンダの詳細ページへ遷移（インデックスを維持）
            router.push(`/agendas/${initialData.id}?occurrence=${occurrenceIndex}`);
          } else {
            setError(result.message ?? 'この回の更新に失敗しました。');
          }
        } else {
          // シリーズ全体の更新
          const request: UpdateAgendaRequest = {
            rowVersion: initialData.rowVersion,
            title: formData.title,
            description: formData.description || null,
            startAt: formData.startAt,
            endAt: formData.endAt,
            isAllDay: formData.isAllDay,
            location: formData.location || null,
            url: formData.url || null,
            recurrenceType: formData.recurrenceType as RecurrenceType,
            recurrenceInterval: formData.recurrenceInterval,
            recurrenceEndDate: formData.recurrenceEndDate || null,
            recurrenceCount: formData.recurrenceCount || null,
            reminders: formData.reminders,
            attendees: formData.attendees,
            sendNotification: formData.sendNotification,
          };

          const result = await updateAgenda(initialData.id, request);
          if (result.success) {
            notify.success('予定を更新しました');
            router.push(`/agendas/${result.data.id}`);
          } else {
            setError(result.message ?? 'アジェンダの更新に失敗しました。');
          }
        }
      }
    });
  };

  // ページタイトル
  const getPageTitle = () => {
    if (mode === 'create') return '新しい予定を作成';
    if (editScope === 'from') return 'この回以降を編集';
    if (editScope === 'single') return 'この回を編集';
    return '予定を編集';
  };

  const pageTitle = getPageTitle();
  const backUrl = mode === 'edit' && initialData ? `/agendas/${initialData.id}` : '/agendas';

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center gap-2">
        <Link href={backUrl} className="btn btn-secondary btn-sm">
          <span className="icon-[tabler--arrow-left] size-4" />
          戻る
        </Link>
        <h1 className="text-xl font-bold">{pageTitle}</h1>
      </div>

      {/* 編集範囲の説明バナー */}
      {editScope === 'from' && occurrenceIndex !== undefined && initialData && (
        <div className="alert alert-info mb-4">
          <span className="icon-[tabler--info-circle] size-5" />
          <div>
            <p className="font-medium">この回以降を編集</p>
            <p className="text-sm opacity-80">
              {new Date(initialData.startAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              以降の予定を変更します。新しい繰り返しシリーズが作成されます。
            </p>
          </div>
        </div>
      )}

      {editScope === 'single' && occurrenceIndex !== undefined && initialData && (
        <div className="alert alert-info mb-4">
          <span className="icon-[tabler--calendar-event] size-5" />
          <div>
            <p className="font-medium">この回のみの編集</p>
            <p className="text-sm opacity-80">
              {new Date(initialData.startAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              の予定のみを変更します。繰り返しパターンの変更はできません。
            </p>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="alert alert-error mb-4">
          <span className="icon-[tabler--alert-circle] size-5" />
          <span>{error}</span>
        </div>
      )}

      {/* フォーム */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <AgendaForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isPending={isPending}
            submitLabel={mode === 'create' ? '作成' : '更新'}
            currentUserId={currentUserId}
            hideRecurrence={editScope === 'single'}
            hideAttendees={editScope === 'single'}
          />
        </div>
      </div>
    </div>
  );
}
