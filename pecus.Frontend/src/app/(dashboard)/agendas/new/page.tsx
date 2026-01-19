export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError } from '@/connectors/api/PecusApiClient';
import AgendaFormClient from './AgendaFormClient';

export default async function NewAgendaPage() {
  try {
    // 認証確認
    const api = createPecusApiClients();
    await api.profile.getApiProfileAppSettings();
  } catch (error) {
    console.error('NewAgendaPage: failed to verify auth', error);

    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
  }

  return <AgendaFormClient mode="create" />;
}
