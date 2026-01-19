'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createAgenda, updateAgenda } from '@/actions/agenda';
import { AgendaForm, type AgendaFormData } from '@/components/agendas/AgendaForm';
import type { AgendaResponse, CreateAgendaRequest, RecurrenceType, UpdateAgendaRequest } from '@/connectors/api/pecus';

interface AgendaFormClientProps {
  mode: 'create' | 'edit';
  initialData?: AgendaResponse;
}

export default function AgendaFormClient({ mode, initialData }: AgendaFormClientProps) {
  const router = useRouter();
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
          router.push(`/agendas/${result.data.id}`);
        } else {
          setError(result.message ?? 'アジェンダの作成に失敗しました。');
        }
      } else if (initialData) {
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
          router.push(`/agendas/${result.data.id}`);
        } else {
          setError(result.message ?? 'アジェンダの更新に失敗しました。');
        }
      }
    });
  };

  const pageTitle = mode === 'create' ? '新しい予定を作成' : '予定を編集';

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center gap-2">
        <Link href="/agendas" className="btn btn-secondary btn-sm">
          <span className="icon-[tabler--arrow-left] size-4" />
          戻る
        </Link>
        <h1 className="text-xl font-bold">{pageTitle}</h1>
      </div>

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
          />
        </div>
      </div>
    </div>
  );
}
