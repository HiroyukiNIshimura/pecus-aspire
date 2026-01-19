export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchAgendaById } from '@/actions/agenda';
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
}

export default async function EditAgendaPage({ params }: EditAgendaPageProps) {
  const { agendaId } = await params;
  const agendaIdNum = parseInt(agendaId, 10);

  if (Number.isNaN(agendaIdNum)) {
    redirect('/agendas');
  }

  try {
    // 認証確認
    const api = createPecusApiClients();
    await api.profile.getApiProfileAppSettings();

    // アジェンダ詳細取得
    const agendaResult = await fetchAgendaById(agendaIdNum);
    if (!agendaResult.success) {
      redirect('/agendas');
    }

    return <AgendaFormClient mode="edit" initialData={agendaResult.data} />;
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
