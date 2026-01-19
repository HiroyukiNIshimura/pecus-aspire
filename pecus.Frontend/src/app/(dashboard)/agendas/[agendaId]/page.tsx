export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchAgendaById, fetchAgendaExceptions } from '@/actions/agenda';
import {
  createPecusApiClients,
  detect401ValidationError,
  detect404ValidationError,
} from '@/connectors/api/PecusApiClient';
import type { AgendaExceptionResponse, AgendaResponse, RecurrenceType } from '@/connectors/api/pecus';
import AgendaDetailClient from './AgendaDetailClient';

interface AgendaDetailPageProps {
  params: Promise<{
    agendaId: string;
  }>;
}

export default async function AgendaDetailPage({ params }: AgendaDetailPageProps) {
  const { agendaId } = await params;
  const agendaIdNum = parseInt(agendaId, 10);

  if (Number.isNaN(agendaIdNum)) {
    redirect('/agendas');
  }

  let agenda: AgendaResponse | null = null;
  let exceptions: AgendaExceptionResponse[] = [];
  let fetchError: string | null = null;

  try {
    // 認証確認
    const api = createPecusApiClients();
    await api.profile.getApiProfileAppSettings();

    // アジェンダ詳細取得
    const agendaResult = await fetchAgendaById(agendaIdNum);
    if (agendaResult.success) {
      agenda = agendaResult.data;

      // 繰り返しアジェンダの場合、例外一覧も取得
      const recurrenceType = agenda.recurrenceType as RecurrenceType | undefined;
      if (recurrenceType && recurrenceType !== 'None') {
        const exceptionsResult = await fetchAgendaExceptions(agendaIdNum);
        if (exceptionsResult.success) {
          exceptions = exceptionsResult.data;
        }
      }
    } else {
      fetchError = agendaResult.message ?? 'アジェンダの取得に失敗しました。';
    }
  } catch (error) {
    console.error('AgendaDetailPage: failed to fetch data', error);

    if (detect401ValidationError(error)) {
      redirect('/signin');
    }

    if (detect404ValidationError(error)) {
      redirect('/agendas');
    }

    fetchError = 'データの取得に失敗しました';
  }

  if (!agenda) {
    redirect('/agendas');
  }

  return <AgendaDetailClient agenda={agenda} exceptions={exceptions} fetchError={fetchError} />;
}
