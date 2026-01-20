export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchAgendaById } from '@/actions/agenda';
import { getCurrentUser } from '@/actions/auth';
import {
  createPecusApiClients,
  detect401ValidationError,
  detect404ValidationError,
} from '@/connectors/api/PecusApiClient';
import AgendaFormClient from '../../new/AgendaFormClient';

interface EditAgendaPageProps {
  params: Promise<{
    agendaId: string;
  }>;
  searchParams: Promise<{
    scope?: 'from' | 'single';
    occurrence?: string;
  }>;
}

export default async function EditAgendaPage({ params, searchParams }: EditAgendaPageProps) {
  const { agendaId } = await params;
  const { scope, occurrence } = await searchParams;
  const agendaIdNum = parseInt(agendaId, 10);
  const occurrenceIndex = occurrence ? parseInt(occurrence, 10) : undefined;

  if (Number.isNaN(agendaIdNum)) {
    redirect('/agendas');
  }

  try {
    // 認証確認
    const api = createPecusApiClients();
    await api.profile.getApiProfileAppSettings();

    // 現在のユーザーID取得
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.data) {
      redirect('/signin');
    }

    // アジェンダ詳細取得（インデックスがある場合は例外適用済みデータを取得）
    const agendaResult = await fetchAgendaById(agendaIdNum, occurrenceIndex);
    if (!agendaResult.success) {
      redirect('/agendas');
    }

    return (
      <AgendaFormClient
        mode="edit"
        initialData={agendaResult.data}
        currentUserId={userResult.data.id}
        editScope={scope}
        occurrenceIndex={occurrenceIndex}
      />
    );
  } catch (error) {
    console.error('EditAgendaPage: failed to fetch data', error);

    if (detect401ValidationError(error)) {
      redirect('/signin');
    }

    if (detect404ValidationError(error)) {
      redirect('/agendas');
    }

    redirect('/agendas');
  }
}
